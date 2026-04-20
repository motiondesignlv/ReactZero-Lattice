import { Nav } from './components/Nav'
import { Hero } from './components/Hero'
import { FeaturesSection } from './sections/FeaturesSection'
import { QuickStartSection } from './sections/QuickStartSection'
import { ArchitectureSection } from './sections/ArchitectureSection'
import { AccessibilitySection } from './sections/AccessibilitySection'
import { SortingSection } from './sections/SortingSection'
import { FilteringSection } from './sections/FilteringSection'
import { PaginationSection } from './sections/PaginationSection'
import { ServerSideSection } from './sections/ServerSideSection'
import { ColumnsSection } from './sections/ColumnsSection'
import { ResponsiveSection } from './sections/ResponsiveSection'
import { HeadlessSection } from './sections/HeadlessSection'
import { ThemingSection } from './sections/ThemingSection'
import { ViewsSection } from './sections/ViewsSection'
import { RichContentSection } from './sections/RichContentSection'
import { PlaygroundSection } from './sections/PlaygroundSection'
import { FooterSection } from './sections/FooterSection'

export function App() {
  return (
    <>
      <Nav />
      <Hero />
      <FeaturesSection />
      <QuickStartSection />
      <ArchitectureSection />
      <AccessibilitySection />
      <SortingSection />
      <FilteringSection />
      <PaginationSection />
      <ServerSideSection />
      <ColumnsSection />
      <ResponsiveSection />
      <HeadlessSection />
      <ThemingSection />
      <ViewsSection />
      <RichContentSection />
      <PlaygroundSection />
      <FooterSection />
    </>
  )
}
