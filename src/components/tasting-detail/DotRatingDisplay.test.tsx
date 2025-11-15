import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DotRatingDisplay } from "./DotRatingDisplay";

/**
 * Unit tests for DotRatingDisplay component
 * Tests correct rendering of dot ratings in read-only format
 */
describe("DotRatingDisplay", () => {
  describe("Rendering", () => {
    it("should render label", () => {
      render(<DotRatingDisplay label="Umami" value={3} />);

      expect(screen.getByText("Umami")).toBeInTheDocument();
    });

    it("should display dash when value is null", () => {
      render(<DotRatingDisplay label="Bitter" value={null} />);

      expect(screen.getByText("—")).toBeInTheDocument();
      expect(screen.getByLabelText("Bitter: Not rated")).toBeInTheDocument();
    });

    it("should display dash when value is undefined", () => {
      render(<DotRatingDisplay label="Sweet" value={undefined} />);

      expect(screen.getByText("—")).toBeInTheDocument();
      expect(screen.getByLabelText("Sweet: Not rated")).toBeInTheDocument();
    });

    it("should render 5 dots total", () => {
      const { container } = render(<DotRatingDisplay label="Foam" value={3} />);

      const dots = container.querySelectorAll("span[aria-hidden='true']");
      expect(dots).toHaveLength(5);
    });

    it("should apply custom className", () => {
      const { container } = render(<DotRatingDisplay label="Umami" value={3} className="custom-class" />);

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Dot Fill States", () => {
    it("should fill correct number of dots for rating 1", () => {
      const { container } = render(<DotRatingDisplay label="Umami" value={1} />);
      const dots = container.querySelectorAll("span[aria-hidden='true']");

      // First dot should be filled (primary color)
      expect(dots[0]).toHaveClass("bg-primary");

      // Rest should be unfilled (gray)
      for (let i = 1; i < 5; i++) {
        expect(dots[i]).toHaveClass("bg-gray-300");
        expect(dots[i]).not.toHaveClass("bg-primary");
      }
    });

    it("should fill correct number of dots for rating 3", () => {
      const { container } = render(<DotRatingDisplay label="Bitter" value={3} />);
      const dots = container.querySelectorAll("span[aria-hidden='true']");

      // First 3 dots should be filled
      for (let i = 0; i < 3; i++) {
        expect(dots[i]).toHaveClass("bg-primary");
      }

      // Last 2 should be unfilled
      for (let i = 3; i < 5; i++) {
        expect(dots[i]).toHaveClass("bg-gray-300");
        expect(dots[i]).not.toHaveClass("bg-primary");
      }
    });

    it("should fill all dots for rating 5", () => {
      const { container } = render(<DotRatingDisplay label="Sweet" value={5} />);
      const dots = container.querySelectorAll("span[aria-hidden='true']");

      // All dots should be filled
      dots.forEach((dot) => {
        expect(dot).toHaveClass("bg-primary");
      });
    });

    it("should not fill any dots for rating 0", () => {
      const { container } = render(<DotRatingDisplay label="Foam" value={0} />);
      const dots = container.querySelectorAll("span[aria-hidden='true']");

      // All dots should be unfilled
      dots.forEach((dot) => {
        expect(dot).toHaveClass("bg-gray-300");
        expect(dot).not.toHaveClass("bg-primary");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle all valid ratings (1-5)", () => {
      [1, 2, 3, 4, 5].forEach((rating) => {
        const { unmount } = render(<DotRatingDisplay label="Umami" value={rating} />);
        expect(screen.getByLabelText(`Umami: ${rating} out of 5`)).toBeInTheDocument();
        unmount();
      });
    });

    it("should handle fractional ratings by treating them as integers", () => {
      const { container } = render(<DotRatingDisplay label="Bitter" value={3.7} />);
      const dots = container.querySelectorAll("span[aria-hidden='true']");

      // Should fill 3 dots (3.7 <= 3 is false for dot 4)
      for (let i = 0; i < 3; i++) {
        expect(dots[i]).toHaveClass("bg-primary");
      }
      expect(dots[3]).toHaveClass("bg-gray-300");
    });

    it("should render without errors for all labels", () => {
      const labels = ["Umami", "Bitter", "Sweet", "Foam Quality"];

      labels.forEach((label) => {
        const { unmount } = render(<DotRatingDisplay label={label} value={4} />);
        expect(screen.getByText(label)).toBeInTheDocument();
        unmount();
      });
    });

    it("should maintain consistent spacing in layout", () => {
      const { container: container1 } = render(<DotRatingDisplay label="Umami" value={1} />);
      const { container: container2 } = render(<DotRatingDisplay label="Bitter" value={5} />);

      // Both should have the same structure
      expect(container1.querySelectorAll("span[aria-hidden='true']")).toHaveLength(5);
      expect(container2.querySelectorAll("span[aria-hidden='true']")).toHaveLength(5);
    });
  });
});
