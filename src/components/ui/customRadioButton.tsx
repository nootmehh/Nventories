"use client";

import React from "react";

interface CustomRadioButtonProps {
	name: string;
	value: string;
	checked?: boolean;
	onChange?: (value: string) => void;
	title: string;
	description?: string;
	disabled?: boolean;
	className?: string;
}

export default function CustomRadioButton({
	name,
	value,
	checked = false,
	onChange,
	title,
	description,
	disabled = false,
	className = "",
}: CustomRadioButtonProps) {
	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (disabled) return;
		onChange?.(e.target.value);
	};

	return (
		<label
			className={`w-full flex gap-3 items-start p-3 rounded-md border-[2px] transition-colors cursor-pointer ${
				checked ? "border-primary-orange bg-white-2" : "border-white-3 bg-white-1"
			} ${disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-white-2 hover:border-primary-orange"} ${className}`}
		>
			<div className="flex-shrink-0">
				<div
					className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors border-2 ${
						checked ? "border-primary-orange bg-white" : "border-grey-1 bg-white-1"
					}`}
				>
					<div
						className={`w-2 h-2 rounded-full transition-colors ${
							checked ? "bg-primary-orange" : "bg-grey-2"
						}`}
					/>
				</div>
			</div>

			<div className="flex-1 text-left">
				<div className={`text-sm font-semibold ${checked ? "text-primary-blue" : "text-grey-desc"}`}>
					{title}
				</div>
				{description ? (
					<div className="text-sm text-grey-2 font-medium mt-1">{description}</div>
				) : null}
			</div>

			{/* visually-hidden native radio for accessibility and form integration */}
			<input
				type="radio"
				name={name}
				value={value}
				checked={checked}
				onChange={handleChange}
				className="sr-only"
				aria-checked={checked}
				disabled={disabled}
			/>
		</label>
	);
}

