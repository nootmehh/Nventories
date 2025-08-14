import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import { createClient } from '@vercel/postgres';

export async function POST(request: NextRequest) {
  // Gunakan connectionString explicit
  const client = createClient({
    connectionString: process.env.POSTGRES_URL,
  });
  await client.connect();

  try {
    const { ownerId, outletName, outletStatus, country, city, fullAddress, accounts } = await request.json();

    if (!ownerId || !outletName || !fullAddress || !accounts || accounts.length === 0) {
      return NextResponse.json({ message: 'All fields and at least one account are required.' }, { status: 400 });
    }

    // Mulai transaction
    await client.sql`BEGIN`;

    // 1. Ambil businessId dari ownerId
    const businessResult = await client.sql`
      SELECT id FROM businesses WHERE user_id = ${ownerId}
    `;
    const business = businessResult.rows[0];
    if (!business) throw new Error('Business not found for the current owner.');
    const businessId = business.id;

    // 2. Simpan akun pekerja
    const insertedAccountIds: { id: number; role: string }[] = [];
    let managerId: number | null = null;

    for (const account of accounts) {
      const hashedPassword = await bcrypt.hash(account.password, 10);
      const userResult = await client.sql`
        INSERT INTO users (name, email, password, role, has_completed_profile)
        VALUES (${account.username}, ${account.email}, ${hashedPassword}, ${account.role}, true)
        RETURNING id
      `;
      const newUserId = userResult.rows[0].id;
      insertedAccountIds.push({ id: newUserId, role: account.role });

      if (account.role === 'Manager') managerId = newUserId;
    }

    if (!managerId) throw new Error('At least one account with Manager role is required.');

    // 3. Simpan data outlet baru
    const outletResult = await client.sql`
      INSERT INTO outlets (business_id, name, country, city, address, status, manager_id)
      VALUES (${businessId}, ${outletName}, ${country}, ${city}, ${fullAddress}, ${outletStatus}, ${managerId})
      RETURNING id
    `;
    const outletId = outletResult.rows[0].id;

    // 4. Update akun pekerja dengan outlet_id
    for (const account of insertedAccountIds) {
      await client.sql`
        UPDATE users SET outlet_id = ${outletId} WHERE id = ${account.id}
      `;
    }

    // Commit transaction
    await client.sql`COMMIT`;

    return NextResponse.json({ message: 'Outlet and accounts created successfully.' }, { status: 201 });

  } catch (error: any) {
    // Rollback jika error
    await client.sql`ROLLBACK`;
    console.error('Transaction error:', error);
    return NextResponse.json({ message: `Failed to create outlet: ${error.message}` }, { status: 500 });
  } finally {
    await client.end();
  }
}
