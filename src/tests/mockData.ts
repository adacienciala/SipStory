/**
 * Mock data for testing
 */

export const mockTastingNote = {
  id: "123e4567-e89b-12d3-a456-426614174000",
  user_id: "user123",
  brand: "Marukyu Koyamaen",
  blend: "Aoarashi",
  region: "Uji, Kyoto",
  overall_rating: 5,
  umami: 5,
  bitter: 2,
  sweet: 4,
  foam_quality: 5,
  notes_koicha: "Rich, creamy, with deep umami notes",
  notes_with_milk: "Smooth and balanced with natural sweetness",
  price_per_100g: 250,
  purchase_source: "https://example.com/matcha",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

export const mockTastingNotes = [
  mockTastingNote,
  {
    id: "223e4567-e89b-12d3-a456-426614174001",
    user_id: "user123",
    brand: "Ippodo Tea",
    blend: "Ummon no Mukashi",
    region: "Uji, Kyoto",
    overall_rating: 4,
    umami: 4,
    bitter: 3,
    sweet: 3,
    foam_quality: 4,
    notes_koicha: "Balanced, slightly astringent",
    notes_with_milk: "Pleasant and smooth",
    price_per_100g: 180,
    purchase_source: "https://example.com/matcha2",
    created_at: "2025-01-02T00:00:00Z",
    updated_at: "2025-01-02T00:00:00Z",
  },
];

export const mockBrand = {
  id: "brand123",
  name: "Marukyu Koyamaen",
  created_at: "2025-01-01T00:00:00Z",
};

export const mockBlend = {
  id: "blend123",
  brand_id: "brand123",
  name: "Aoarashi",
  created_at: "2025-01-01T00:00:00Z",
};

export const mockRegion = {
  id: "region123",
  name: "Uji, Kyoto",
  created_at: "2025-01-01T00:00:00Z",
};

export const mockUser = {
  id: "user123",
  email: "test@example.com",
  has_completed_onboarding: true,
  created_at: "2025-01-01T00:00:00Z",
};
