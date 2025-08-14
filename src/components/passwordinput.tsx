'use client';

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react"; // Menggunakan EyeOff untuk konsistensi
import { CustomInput } from "@/components/ui/input";

// Perbarui props agar menerima value dan onChange
interface PasswordInputProps {
  label?: string;
  placeholder?: string;
  className?: string;
  value: string; // Tambahkan prop value
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void; // Tambahkan prop onChange
  required?: boolean;
}

export default function PasswordInput({
  label = "Password",
  placeholder = "Your password here",
  className = "",
  value,
  onChange,
  ...props
}: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <CustomInput
      type={showPassword ? "text" : "password"}
      label={label}
      placeholder={placeholder}
      className={`w-full ${className}`}
      // Teruskan prop value dan onChange ke CustomInput
      value={value}
      onChange={onChange}
      iconRight={
        showPassword ? (
          <EyeOff
            className="w-5 h-5 text-grey-desc cursor-pointer"
            onClick={() => setShowPassword(false)}
          />
        ) : (
          <Eye
            className="w-5 h-5 text-grey-desc cursor-pointer"
            onClick={() => setShowPassword(true)}
          />
        )
      }
      {...props}
    />
  );
}