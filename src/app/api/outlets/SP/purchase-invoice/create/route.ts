import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@vercel/postgres';

export async function POST(request: NextRequest) {
    const client = createClient({ connectionString: process.env.POSTGRES_URL });
    await client.connect();
    
    try {
        const {
            purchaseOrderId,
            receiptDate,
            paymentAmount,
            paymentDueDate,
            paymentStatus,
            products, // Array of products from frontend
        } = await request.json();

        if (!purchaseOrderId || !receiptDate || !paymentAmount || !paymentStatus || !products || products.length === 0) {
            return NextResponse.json({ message: 'Missing required fields.' }, { status: 400 });
        }

        try {
            await client.query('BEGIN');
            
            // 1. Masukkan data ke tabel 'purchase_invoices'
            const invoiceResult = await client.sql`
                INSERT INTO purchase_invoices (purchase_order_id, receipt_date, payment_amount, payment_due_date, payment_status)
                VALUES (${purchaseOrderId}, ${receiptDate}, ${paymentAmount}, ${paymentDueDate}, ${paymentStatus})
                RETURNING id
            `;
            const purchaseInvoiceId = invoiceResult.rows[0].id;

            // 2. Masukkan setiap item produk ke tabel 'purchase_invoice_items'
            for (const product of products) {
                let purchaseOrderDetailId: number | undefined;

                // If frontend provided purchase_order_detail_id directly, prefer it
                if (product.purchase_order_detail_id) {
                    purchaseOrderDetailId = Number(product.purchase_order_detail_id);
                }

                // If frontend sent `id` but it actually is a purchase_order_detail id, prefer that
                if (!purchaseOrderDetailId && product.id) {
                    const { rows: detailById } = await client.sql`
                        SELECT id FROM purchase_order_details WHERE purchase_order_id = ${purchaseOrderId} AND id = ${product.id} LIMIT 1
                    `;
                    purchaseOrderDetailId = detailById[0]?.id;
                }

                // Try by raw_material_id (common case where frontend sends raw_material_id as `id`)
                if (!purchaseOrderDetailId) {
                    const { rows: detailRows } = await client.sql`
                        SELECT id FROM purchase_order_details 
                        WHERE purchase_order_id = ${purchaseOrderId} AND raw_material_id = ${product.id}
                        LIMIT 1
                    `;
                    purchaseOrderDetailId = detailRows[0]?.id;
                }

                // If not found, try to resolve raw_material by material_name or sku then find the detail
                if (!purchaseOrderDetailId) {
                    let rawId: number | undefined;
                    if (product.material_name) {
                        const { rows: rmRows } = await client.sql`
                            SELECT id FROM raw_material WHERE LOWER(material_name) = LOWER(${product.material_name}) LIMIT 1
                        `;
                        rawId = rmRows[0]?.id;
                    }

                    if (!rawId && product.sku) {
                        const { rows: rmRows2 } = await client.sql`
                            SELECT id FROM raw_material WHERE sku = ${product.sku} LIMIT 1
                        `;
                        rawId = rmRows2[0]?.id;
                    }

                    if (rawId) {
                        const { rows: detailRows2 } = await client.sql`
                            SELECT id FROM purchase_order_details WHERE purchase_order_id = ${purchaseOrderId} AND raw_material_id = ${rawId} LIMIT 1
                        `;
                        purchaseOrderDetailId = detailRows2[0]?.id;
                    }
                }

                // Last-resort: join purchase_order_details with raw_material and try matching by name or sku
                if (!purchaseOrderDetailId) {
                    const { rows: joined } = await client.sql`
                        SELECT pod.id
                        FROM purchase_order_details pod
                        JOIN raw_material rm ON rm.id = pod.raw_material_id
                        WHERE pod.purchase_order_id = ${purchaseOrderId}
                          AND (
                              LOWER(rm.material_name) = LOWER(${product.material_name})
                              OR rm.sku = ${product.sku}
                          )
                        LIMIT 1
                    `;
                    purchaseOrderDetailId = joined[0]?.id;
                }

                if (!purchaseOrderDetailId) {
                    // If we still can't find a matching purchase_order_detail, return a helpful 400
                    const { rows: available } = await client.sql`
                        SELECT pod.id AS purchase_order_detail_id, pod.raw_material_id, rm.material_name, rm.sku
                        FROM purchase_order_details pod
                        LEFT JOIN raw_material rm ON rm.id = pod.raw_material_id
                        WHERE pod.purchase_order_id = ${purchaseOrderId}
                    `;

                    await client.query('ROLLBACK');
                    return NextResponse.json(
                        {
                            message: `Detail for product '${product.material_name ?? product.sku ?? product.id}' not found (tried raw_material_id, name, sku).`,
                            product,
                            availableDetails: available
                        },
                        { status: 400 }
                    );
                }

                await client.sql`
                    INSERT INTO purchase_invoice_items (purchase_invoice_id, purchase_order_detail_id, quantity_received)
                    VALUES (${purchaseInvoiceId}, ${purchaseOrderDetailId}, ${product.quantity_received})
                `;
            }

            // 2.5 Fetch PO summary to decide invoice_process update
            const { rows: poRows } = await client.sql`
                SELECT id, total_amount, dp_amount
                FROM purchase_orders
                WHERE id = ${purchaseOrderId}
                LIMIT 1
            `;
            const po = poRows[0];
            const poTotal = Number(po?.total_amount || 0);
            const poDp = po?.dp_amount == null ? 0 : Number(po.dp_amount);

            // 3. Update invoice_process to 'Paid' if payment covers remaining amount
            const remainingToPay = poTotal - poDp;
            if (Number(paymentAmount || 0) >= remainingToPay) {
                await client.sql`
                    UPDATE purchase_orders SET invoice_process = 'Paid' WHERE id = ${purchaseOrderId}
                `;
            }

            // 4. Check if all purchase_order_details have been fully received across invoices
            // If all details fulfilled -> set delivery_status = 'Fully Delivered'
            // We'll check for any detail where total received < ordered quantity
            const { rows: outstanding } = await client.sql`
                SELECT pod.id
                FROM purchase_order_details pod
                LEFT JOIN (
                    SELECT purchase_order_detail_id, COALESCE(SUM(quantity_received),0) AS total_received
                    FROM purchase_invoice_items
                    GROUP BY purchase_order_detail_id
                ) recv ON recv.purchase_order_detail_id = pod.id
                WHERE pod.purchase_order_id = ${purchaseOrderId}
                  AND COALESCE(recv.total_received, 0) < pod.quantity
                LIMIT 1
            `;

            if (!outstanding || outstanding.length === 0) {
                await client.sql`
                    UPDATE purchase_orders SET delivery_status = 'Fully Delivered' WHERE id = ${purchaseOrderId}
                `;
            }

            // 3. Perbarui total stok dan status di tabel raw_material
            // Logika ini akan sangat kompleks dan di luar lingkup API ini

            await client.query('COMMIT');
            return NextResponse.json({ message: 'Purchase invoice created successfully.' }, { status: 201 });

        } catch (transactionError: any) {
            await client.query('ROLLBACK');
            console.error('Transaction error:', transactionError);
            return NextResponse.json({ message: transactionError.message || 'Failed to create purchase invoice.' }, { status: 500 });
        } finally {
            // NOTE: client will be closed in outer finally as well to ensure closure if earlier throws
        }

    } catch (error: any) {
        console.error('API /outlets/SP/purchase-invoice/create error:', error);
        return NextResponse.json({ message: error?.message || 'Internal server error' }, { status: 500 });
    }
    finally {
        try {
            await client.end();
        } catch (e) {
            console.error('Error closing DB client:', e);
        }
    }
}