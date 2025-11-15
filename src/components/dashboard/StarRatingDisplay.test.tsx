import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StarRatingDisplay } from "./StarRatingDisplay";

/**
 * Unit tests for StarRatingDisplay component
 * Tests correct rendering of star ratings in read-only format
 */
describe("StarRatingDisplay", () => {
  describe("Rendering", () => {
    it("should render 5 stars total", () => {
      render(<StarRatingDisplay rating={3} />);

      // SVG stars are rendered
      const container = screen.getByLabelText("Rating: 3 out of 5 stars");
      const stars = container.querySelectorAll("svg");

      expect(stars).toHaveLength(5);
    });

    it("should display rating number", () => {
      render(<StarRatingDisplay rating={4} />);

      expect(screen.getByText("4")).toBeInTheDocument();
    });

    it("should apply custom className", () => {
      const { container } = render(<StarRatingDisplay rating={3} className="custom-class" />);

      expect(container.firstChild).toHaveClass("custom-class");
    });
  });

  describe("Star Fill States", () => {
    it("should fill correct number of stars for rating 1", () => {
      const { container } = render(<StarRatingDisplay rating={1} />);
      const stars = container.querySelectorAll("svg");

      // First star should be filled (yellow)
      expect(stars[0]).toHaveClass("fill-yellow-400", "text-yellow-400");

      // Rest should be unfilled (gray)
      for (let i = 1; i < 5; i++) {
        expect(stars[i]).toHaveClass("text-gray-300");
        expect(stars[i]).not.toHaveClass("fill-yellow-400");
      }
    });

    it("should fill correct number of stars for rating 3", () => {
      const { container } = render(<StarRatingDisplay rating={3} />);
      const stars = container.querySelectorAll("svg");

      // First 3 stars should be filled
      for (let i = 0; i < 3; i++) {
        expect(stars[i]).toHaveClass("fill-yellow-400", "text-yellow-400");
      }

      // Last 2 should be unfilled
      for (let i = 3; i < 5; i++) {
        expect(stars[i]).toHaveClass("text-gray-300");
        expect(stars[i]).not.toHaveClass("fill-yellow-400");
      }
    });

    it("should fill all stars for rating 5", () => {
      const { container } = render(<StarRatingDisplay rating={5} />);
      const stars = container.querySelectorAll("svg");

      // All stars should be filled
      stars.forEach((star) => {
        expect(star).toHaveClass("fill-yellow-400", "text-yellow-400");
      });
    });

    it("should handle rating 0 (no filled stars)", () => {
      const { container } = render(<StarRatingDisplay rating={0} />);
      const stars = container.querySelectorAll("svg");

      // All stars should be unfilled
      stars.forEach((star) => {
        expect(star).toHaveClass("text-gray-300");
        expect(star).not.toHaveClass("fill-yellow-400");
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle all valid ratings (1-5)", () => {
      [1, 2, 3, 4, 5].forEach((rating) => {
        const { unmount } = render(<StarRatingDisplay rating={rating} />);
        expect(screen.getByText(rating.toString())).toBeInTheDocument();
        unmount();
      });
    });

    it("should handle fractional ratings by rounding down", () => {
      const { container } = render(<StarRatingDisplay rating={3.7} />);
      const stars = container.querySelectorAll("svg");

      // Should fill 3 stars (rounds down 3.7 -> 3)
      for (let i = 0; i < 3; i++) {
        expect(stars[i]).toHaveClass("fill-yellow-400");
      }
    });

    it("should display exact rating number including decimals", () => {
      render(<StarRatingDisplay rating={4.5} />);

      expect(screen.getByText("4.5")).toBeInTheDocument();
    });
  });
});
