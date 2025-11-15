import { render, screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AutocompleteInput } from "./AutocompleteInput";
import type { AutocompleteOption } from "./types";

/**
 * Unit tests for AutocompleteInput component
 * Tests user interaction, filtering, and selection behavior
 */
describe("AutocompleteInput", () => {
  const mockSuggestions: AutocompleteOption[] = [
    { id: "1", name: "Matcha A" },
    { id: "2", name: "Matcha B" },
    { id: "3", name: "Green Tea" },
    { id: "4", name: "Sencha" },
  ];

  describe("Rendering", () => {
    it("should render label with required indicator when required", () => {
      const mockOnChange = vi.fn();
      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
          required
        />
      );

      expect(screen.getByText("Brand")).toBeInTheDocument();
      expect(screen.getByText("*")).toBeInTheDocument();
    });

    it("should render label without required indicator when not required", () => {
      const mockOnChange = vi.fn();
      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
          required={false}
        />
      );

      expect(screen.getByText("Brand")).toBeInTheDocument();
      expect(screen.queryByText("*")).not.toBeInTheDocument();
    });

    it("should show placeholder when value is empty", () => {
      const mockOnChange = vi.fn();
      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
        />
      );

      expect(screen.getByRole("combobox")).toHaveTextContent("Select brand");
    });

    it("should show current value when provided", () => {
      const mockOnChange = vi.fn();
      render(
        <AutocompleteInput
          value="Matcha A"
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
        />
      );

      expect(screen.getByRole("combobox")).toHaveTextContent("Matcha A");
    });

    it("should display error message when provided", () => {
      const mockOnChange = vi.fn();
      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
          error="Brand is required"
        />
      );

      expect(screen.getByText("Brand is required")).toBeInTheDocument();
    });

    it("should show loader icon when isLoading is true", () => {
      const mockOnChange = vi.fn();
      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
          isLoading
        />
      );

      // Loader2 icon should be present (has animate-spin class)
      const button = screen.getByRole("combobox");
      const loader = button.querySelector(".animate-spin");
      expect(loader).toBeInTheDocument();
    });

    it("should disable button when disabled prop is true", () => {
      const mockOnChange = vi.fn();
      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
          disabled
        />
      );

      expect(screen.getByRole("combobox")).toBeDisabled();
    });

    it("should disable button when isLoading is true", () => {
      const mockOnChange = vi.fn();
      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
          isLoading
        />
      );

      expect(screen.getByRole("combobox")).toBeDisabled();
    });
  });

  describe("Popover Opening", () => {
    it("should open popover when button is clicked", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
        />
      );

      const button = screen.getByRole("combobox");
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search brand...")).toBeInTheDocument();
      });
    });

    it("should display all suggestions when opened", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByText("Matcha A")).toBeInTheDocument();
        expect(screen.getByText("Matcha B")).toBeInTheDocument();
        expect(screen.getByText("Green Tea")).toBeInTheDocument();
        expect(screen.getByText("Sencha")).toBeInTheDocument();
      });
    });
  });

  describe("Filtering", () => {
    it("should filter suggestions based on search input", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
        />
      );

      await user.click(screen.getByRole("combobox"));
      const searchInput = await screen.findByPlaceholderText("Search brand...");
      await user.type(searchInput, "Matcha");

      await waitFor(() => {
        expect(screen.getByText("Matcha A")).toBeInTheDocument();
        expect(screen.getByText("Matcha B")).toBeInTheDocument();
        expect(screen.queryByText("Green Tea")).not.toBeInTheDocument();
        expect(screen.queryByText("Sencha")).not.toBeInTheDocument();
      });
    });

    it("should be case-insensitive when filtering", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
        />
      );

      await user.click(screen.getByRole("combobox"));
      const searchInput = await screen.findByPlaceholderText("Search brand...");
      await user.type(searchInput, "MATCHA");

      await waitFor(() => {
        expect(screen.getByText("Matcha A")).toBeInTheDocument();
        expect(screen.getByText("Matcha B")).toBeInTheDocument();
      });
    });

    it("should show 'Create' message when no matches found", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
        />
      );

      await user.click(screen.getByRole("combobox"));
      const searchInput = await screen.findByPlaceholderText("Search brand...");
      await user.type(searchInput, "Nonexistent");

      await waitFor(() => {
        expect(screen.getByText('Create "Nonexistent"')).toBeInTheDocument();
      });
    });

    it("should show 'No results found' when search is empty and no suggestions", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <AutocompleteInput value="" onChange={mockOnChange} suggestions={[]} placeholder="Select brand" label="Brand" />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        expect(screen.getByText("No results found")).toBeInTheDocument();
      });
    });
  });

  describe("Selection Behavior", () => {
    it("should call onChange with id and name when suggestion is selected", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
        />
      );

      await user.click(screen.getByRole("combobox"));
      const option = await screen.findByText("Matcha A");
      await user.click(option);

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith("1", "Matcha A");
      });
    });

    it("should close popover after selection", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
        />
      );

      await user.click(screen.getByRole("combobox"));
      const option = await screen.findByText("Matcha A");
      await user.click(option);

      await waitFor(() => {
        expect(screen.queryByPlaceholderText("Search brand...")).not.toBeInTheDocument();
      });
    });

    it("should clear search after selection", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
        />
      );

      await user.click(screen.getByRole("combobox"));
      const searchInput = await screen.findByPlaceholderText("Search brand...");
      await user.type(searchInput, "Matcha");
      const option = await screen.findByText("Matcha A");
      await user.click(option);

      // Reopen to check if search is cleared
      await user.click(screen.getByRole("combobox"));
      const reopenedInput = await screen.findByPlaceholderText("Search brand...");
      expect(reopenedInput).toHaveValue("");
    });
  });

  describe("Manual Input (New Entries)", () => {
    it("should call onChange with null id for new entry", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
        />
      );

      await user.click(screen.getByRole("combobox"));
      const searchInput = await screen.findByPlaceholderText("Search brand...");
      await user.type(searchInput, "New Brand");

      await waitFor(() => {
        expect(mockOnChange).toHaveBeenLastCalledWith(null, "New Brand");
      });
    });

    it("should call onChange for each character typed", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
        />
      );

      await user.click(screen.getByRole("combobox"));
      const searchInput = await screen.findByPlaceholderText("Search brand...");
      await user.type(searchInput, "ABC");

      // Should be called for 'A', 'B', 'C'
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledTimes(3);
        expect(mockOnChange).toHaveBeenNthCalledWith(1, null, "A");
        expect(mockOnChange).toHaveBeenNthCalledWith(2, null, "AB");
        expect(mockOnChange).toHaveBeenNthCalledWith(3, null, "ABC");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty suggestions array", () => {
      const mockOnChange = vi.fn();

      render(
        <AutocompleteInput value="" onChange={mockOnChange} suggestions={[]} placeholder="Select brand" label="Brand" />
      );

      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("should handle very long suggestion names", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();
      const longNameSuggestions = [
        {
          id: "1",
          name: "Very Long Brand Name That Should Be Truncated In The Display Area Of The Combobox Button",
        },
      ];

      render(
        <AutocompleteInput
          value="Very Long Brand Name That Should Be Truncated In The Display Area Of The Combobox Button"
          onChange={mockOnChange}
          suggestions={longNameSuggestions}
          placeholder="Select brand"
          label="Brand"
        />
      );

      const button = screen.getByRole("combobox");
      expect(button).toHaveTextContent("Very Long Brand Name");
    });

    it("should show check icon for selected item in dropdown", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <AutocompleteInput
          value="Matcha A"
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
        />
      );

      await user.click(screen.getByRole("combobox"));

      await waitFor(() => {
        // Find all instances of "Matcha A" text
        const matchaAElements = screen.getAllByText("Matcha A");
        // The dropdown option is the one with role="option"
        const dropdownOption = matchaAElements.find((el) => el.closest('[role="option"]'));
        expect(dropdownOption).toBeInTheDocument();

        // Find the check icon within the dropdown option
        const optionContainer = dropdownOption?.closest('[role="option"]');
        const checkIcon = optionContainer?.querySelector("svg");
        expect(checkIcon).toBeInTheDocument();
        expect(checkIcon).toHaveClass("opacity-100");
      });
    });

    it("should not have disabled attribute when neither disabled nor isLoading", () => {
      const mockOnChange = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
          disabled={false}
          isLoading={false}
        />
      );

      expect(screen.getByRole("combobox")).not.toBeDisabled();
    });

    it("should handle rapid open/close of popover", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(
        <AutocompleteInput
          value=""
          onChange={mockOnChange}
          suggestions={mockSuggestions}
          placeholder="Select brand"
          label="Brand"
        />
      );

      const button = screen.getByRole("combobox");

      // Rapidly click to open and close
      await user.click(button);
      await user.click(button);
      await user.click(button);

      // Should still work correctly
      await waitFor(() => {
        expect(screen.getByPlaceholderText("Search brand...")).toBeInTheDocument();
      });
    });
  });
});
