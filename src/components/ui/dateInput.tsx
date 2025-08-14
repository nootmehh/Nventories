"use client"

import * as React from "react"
import { CalendarSearch } from "lucide-react"

import { CustomButton } from "@/components/ui/customButton"
import { Calendar } from "@/components/ui/calendar"
import { CustomInput } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function formatDateForInput(date: Date | undefined) {
  if (!date) return ""
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  })
}

function isValidDate(date: Date | undefined) {
  return !!date && !isNaN(date.getTime())
}

interface DateInputProps {
  label?: string
  placeholder?: string
  value?: Date | undefined
  onChange?: (date: Date | undefined) => void
  onDateChange?: (date: Date | undefined) => void
}

export function DateInput({
  label = "Subscription Date",
  placeholder = "Choose Date",
  value,
  onChange,
}: DateInputProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(value)
  const [month, setMonth] = React.useState<Date | undefined>(value)
  const [inputValue, setInputValue] = React.useState(formatDateForInput(value))

  // Sync state with prop
  React.useEffect(() => {
    setDate(value)
    setMonth(value)
    setInputValue(formatDateForInput(value))
  }, [value])

  const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value
    setInputValue(rawValue)
    const newDate = new Date(rawValue)
    if (isValidDate(newDate)) {
      setDate(newDate)
      setMonth(newDate)
      if (onChange) onChange(newDate)
    } else {
      setDate(undefined)
      if (onChange) onChange(undefined)
    }
  }

  const handleSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate)
    if (onChange) onChange(selectedDate)
    setInputValue(formatDateForInput(selectedDate))
    setOpen(false)
  }

  const handleClear = () => {
    setDate(undefined)
    setMonth(undefined)
    setInputValue("")
    if (onChange) onChange(undefined)
    setOpen(false)
  }
  
  const handleToday = () => {
    const today = new Date();
    setDate(today)
    setMonth(today)
    setInputValue(formatDateForInput(today))
    if (onChange) onChange(today)
    setOpen(false)
  };

  return (
    <div className="w-full flex flex-col gap-1">
      <Label htmlFor="date" className="text-sm text-grey-desc">
        {label}
      </Label>
      <div className="relative flex gap-2">
        <CustomInput
          id="date"
          value={inputValue}
          placeholder={placeholder}
          className="bg-white-2 w-full"
          onChange={handleManualChange}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault()
              setOpen(true)
            }
          }}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <CustomButton
              id="date-picker"
              variant="ghost"
              iconPlacement="right"
              size={'smallIcon'}
              Icon={CalendarSearch}
              className="absolute top-1/2 right-3 -translate-y-1/2"
            />
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={date}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={handleSelect}
            />
            <div className={cn("flex justify-between p-2 border-t", !isValidDate(date) && "justify-end")}>
                {isValidDate(date) && (
                    <CustomButton variant="ghost" onClick={handleClear}>Clear</CustomButton>
                )}
                <CustomButton variant="ghost" onClick={handleToday}>Today</CustomButton>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}