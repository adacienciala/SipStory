import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export default function OnboardingView() {
  const handleGetStarted = () => {
    // Use window.location for navigation to ensure page load
    window.location.href = "/tasting-notes/new";
  };

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header Section */}
        <header className="text-center space-y-4">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Welcome to SipStory</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Your personal matcha tasting journal. Let&apos;s help you understand the key concepts before you log your
            first tasting note.
          </p>
        </header>

        {/* Key Tasting Concepts Section */}
        <section className="space-y-6" aria-labelledby="concepts-heading">
          <h2 id="concepts-heading" className="text-2xl font-semibold text-foreground">
            Key Tasting Concepts
          </h2>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2">
            {/* Umami Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Umami</CardTitle>
                <CardDescription>The Fifth Taste</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Umami is a savory, rich flavor that distinguishes high-quality matcha. It&apos;s often described as a
                  pleasant, brothy taste that lingers on your palate. If you ever tasted MSG, that is the flavor profile
                  you should look for. Premium matcha typically has strong umami notes, while lower grades may lack this
                  complexity.
                </p>
              </CardContent>
            </Card>

            {/* Foam Quality Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Foam Quality</CardTitle>
                <CardDescription>Texture Matters</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  When properly whisked, matcha produces a fine, creamy foam on top. The quality and consistency of this
                  foam can indicate freshness and proper preparation. Look for smooth, uniform bubbles rather than
                  large, uneven ones.
                </p>
              </CardContent>
            </Card>

            {/* Bitterness Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Bitterness</CardTitle>
                <CardDescription>Balance is Key</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Some bitterness is natural in matcha, especially in ceremonial grades. However, excessive bitterness
                  can indicate lower quality, improper storage, or incorrect preparation. The best matcha balances
                  bitterness with sweetness and umami.
                </p>
              </CardContent>
            </Card>

            {/* Sweetness Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Sweetness</CardTitle>
                <CardDescription>Natural Flavor</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  High-quality matcha often has a subtle natural sweetness that emerges after the initial taste. This
                  sweetness comes from amino acids in the tea leaves and is a sign of careful cultivation. It
                  shouldn&apos;t be confused with added sweeteners.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How to Log an Entry Section */}
        <section className="space-y-6" aria-labelledby="howto-heading">
          <h2 id="howto-heading" className="text-2xl font-semibold text-foreground">
            How to Log Your First Entry
          </h2>

          <Card>
            <CardContent>
              <ol className="space-y-4 list-decimal list-inside text-muted-foreground">
                <li className="text-sm leading-relaxed">
                  <span className="font-medium text-foreground">Choose your matcha:</span> Enter the brand name and
                  specific blend you&apos;re tasting. These will be saved for quick selection in future entries.
                </li>
                <li className="text-sm leading-relaxed">
                  <span className="font-medium text-foreground">Rate overall quality:</span> Give it a star rating from
                  1 to 5 based on your overall impression.
                </li>
                <li className="text-sm leading-relaxed">
                  <span className="font-medium text-foreground">Rate specific characteristics:</span> Optionally rate
                  umami, bitterness, sweetness, and foam quality on a scale of 1-5.
                </li>
                <li className="text-sm leading-relaxed">
                  <span className="font-medium text-foreground">Add tasting notes:</span> Describe your experience
                  drinking it as koicha (thick liquid that you get after whisking) or with milk, if applicable.
                </li>
                <li className="text-sm leading-relaxed">
                  <span className="font-medium text-foreground">Record details:</span> Add the price per 100g and where
                  you purchased it to track value.
                </li>
              </ol>
            </CardContent>
          </Card>
        </section>

        {/* Call to Action */}
        <div className="flex justify-center pt-4">
          <Button size="lg" onClick={handleGetStarted} className="min-w-[200px]">
            Get Started
          </Button>
        </div>
      </div>
    </main>
  );
}
