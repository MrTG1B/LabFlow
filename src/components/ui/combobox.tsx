
"use client"

import * as React from "react"
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface ComboboxProps {
    options: { value: string; label: string }[];
    value: string;
    onChange: (value: string) => void;
    onCreate?: (value: string) => void;
    placeholder?: string;
    notFoundMessage?: string;
    createMessage?: string;
    isLoading?: boolean;
}

export function Combobox({
  options,
  value,
  onChange,
  onCreate,
  placeholder = "Select an option...",
  notFoundMessage = "No options found.",
  createMessage = "Create",
  isLoading = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState("")

  const handleSelect = (currentValue: string) => {
    onChange(currentValue === value ? "" : currentValue)
    setOpen(false)
  }

  const handleCreate = () => {
    if (onCreate && inputValue) {
      onCreate(inputValue)
      onChange(inputValue) // Automatically select the newly created item
      setOpen(false)
    }
  }

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showCreateOption = onCreate && inputValue && !options.some(option => option.label.toLowerCase() === inputValue.toLowerCase());

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value
            ? options.find((option) => option.value === value)?.label
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={placeholder}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            {isLoading && <CommandEmpty>Loading...</CommandEmpty>}
            {!isLoading && filteredOptions.length === 0 && !showCreateOption && <CommandEmpty>{notFoundMessage}</CommandEmpty>}
            <CommandGroup>
              {filteredOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => handleSelect(option.value)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option.label}
                </CommandItem>
              ))}
              {showCreateOption && (
                <CommandItem
                  onSelect={handleCreate}
                  className="text-primary hover:!bg-primary/10 cursor-pointer"
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  {createMessage} "{inputValue}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
