import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DotRatingInput } from "./DotRatingInput";

/**
 * Unit tests for DotRatingInput component
 * Tests user interaction, rating selection, and accessibility
 */
describe("DotRatingInput", () => {
  describe("Rendering", () => {
    it("should render 5 dots", () => {
      const mockOnChange = vi.fn();
      render(<DotRatingInput value={null} onChange={mockOnChange} label="Umami" />);

      const dots = screen.getAllByRole("radio");
      expect(dots).toHaveLength(5);
    });

    it("should display label correctly", () => {
      const mockOnChange = vi.fn();
      render(<DotRatingInput value={null} onChange={mockOnChange} label="Bitter Rating" />);

      expect(screen.getByText("Bitter Rating")).toBeInTheDocument();
    });

    it("should show 'Not rated' text when value is null", () => {
      const mockOnChange = vi.fn();
      render(<DotRatingInput value={null} onChange={mockOnChange} label="Umami" />);

      expect(screen.getByText("Not rated")).toBeInTheDocument();
    });

    it("should show rating value when set", () => {
      const mockOnChange = vi.fn();
      render(<DotRatingInput value={3} onChange={mockOnChange} label="Umami" />);

      expect(screen.getByText("3/5")).toBeInTheDocument();
    });

    it("should display error message when provided", () => {
      const mockOnChange = vi.fn();
      render(<DotRatingInput value={null} onChange={mockOnChange} label="Umami" error="Rating is required" />);

      expect(screen.getByText("Rating is required")).toBeInTheDocument();
    });
  });

  describe("User Interaction", () => {
    it("should call onChange when dot is clicked", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(<DotRatingInput value={null} onChange={mockOnChange} label="Umami" />);

      const dots = screen.getAllByRole("radio");
      await user.click(dots[2]); // Click 3rd dot

      expect(mockOnChange).toHaveBeenCalledWith(3);
    });

    it("should toggle rating when clicking the same value", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(<DotRatingInput value={3} onChange={mockOnChange} label="Umami" />);

      const dots = screen.getAllByRole("radio");
      await user.click(dots[2]); // Click 3rd dot again (already selected)

      expect(mockOnChange).toHaveBeenCalledWith(null);
    });

    it("should update to new rating when different dot is clicked", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(<DotRatingInput value={2} onChange={mockOnChange} label="Umami" />);

      const dots = screen.getAllByRole("radio");
      await user.click(dots[4]); // Click 5th dot

      expect(mockOnChange).toHaveBeenCalledWith(5);
    });

    it("should not trigger onChange when disabled", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(<DotRatingInput value={null} onChange={mockOnChange} label="Umami" disabled />);

      const dots = screen.getAllByRole("radio");
      await user.click(dots[2]);

      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle all rating values (1-5)", () => {
      const mockOnChange = vi.fn();

      [1, 2, 3, 4, 5].forEach((rating) => {
        const { unmount } = render(<DotRatingInput value={rating} onChange={mockOnChange} label="Umami" />);
        expect(screen.getByText(`${rating}/5`)).toBeInTheDocument();
        unmount();
      });
    });

    it("should handle rapid clicks correctly", async () => {
      const user = userEvent.setup();
      const mockOnChange = vi.fn();

      render(<DotRatingInput value={null} onChange={mockOnChange} label="Umami" />);

      const dots = screen.getAllByRole("radio");

      await user.click(dots[0]);
      await user.click(dots[2]);
      await user.click(dots[4]);

      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 1);
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 3);
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 5);
    });
  });
});
