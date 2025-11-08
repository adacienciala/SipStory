/**
 * AutocompleteInput Component
 * A combobox component with autocomplete functionality
 * Uses Shadcn/ui Command and Popover components
 */

import { Check, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../ui/command";
import { Label } from "../ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { AutocompleteInputProps } from "./types";

export function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  label,
  required = false,
  disabled = false,
  error,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Filter suggestions based on search input
  const filteredSuggestions = useMemo(() => {
    if (!search) return suggestions;
    return suggestions.filter((suggestion) => suggestion.toLowerCase().includes(search.toLowerCase()));
  }, [suggestions, search]);

  // Handle selection from dropdown
  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue);
    setOpen(false);
    setSearch("");
  };

  // Handle manual input (for new entries)
  const handleSearchChange = (newSearch: string) => {
    setSearch(newSearch);
    onChange(newSearch);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={label} className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={label}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={label}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !value && "text-muted-foreground",
              error && "border-red-500 focus-visible:ring-red-500"
            )}
          >
            <span className="truncate">{value || placeholder}</span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder={`Search ${label.toLowerCase()}...`}
              value={search || value}
              onValueChange={handleSearchChange}
            />
            <CommandList>
              <CommandEmpty>{search ? `Create "${search}"` : "No results found"}</CommandEmpty>
              <CommandGroup>
                {filteredSuggestions.map((suggestion) => (
                  <CommandItem key={suggestion} value={suggestion} onSelect={() => handleSelect(suggestion)}>
                    <Check className={cn("mr-2 h-4 w-4", value === suggestion ? "opacity-100" : "opacity-0")} />
                    {suggestion}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
