import { useWindowWidth } from '../lib/hooks'
import HotRanking from '../components/home/HotRanking'
import EditorPicks from '../components/home/EditorPicks'
import HotStocks from '../components/home/HotStocks'
import MiniCharts from '../components/home/MiniCharts'
import CategoryTiles from '../components/home/CategoryTiles'
import SectorHeatmap from '../components/home/SectorHeatmap'
import CryptoZone from '../components/home/CryptoZone'
import FlashFeed from '../components/home/FlashFeed'
import TrendingBox from '../components/home/TrendingBox'
import CalendarBox from '../components/home/CalendarBox'
import GlobalMarkets from '../components/home/GlobalMarkets'
import CategoryBoards from '../components/home/CategoryBoards'
import BrowseBySource from '../components/home/BrowseBySource'

export default function Home() {
  const w = useWindowWidth()
  const mobile = w < 900
  const wide = w >= 1300

  const col = { display: 'flex', flexDirection: 'column' as const, gap: 10, alignSelf: 'start' as const }

  const Mid = (
    <div style={{ ...col }}>
      <EditorPicks />
      <MiniCharts />
      <HotStocks maxHeight={520} />
      <CategoryTiles />
      <SectorHeatmap />
      <CryptoZone />
    </div>
  )

  // Medium/mobile: single stacked side column (keeps Trending here).
  const Side = (
    <div style={{ ...col }}>
      <FlashFeed />
      <TrendingBox />
      <CalendarBox />
      <GlobalMarkets twoColumn={!mobile && !wide} />
    </div>
  )

  // Wide: Trending moves under Hot on the LEFT so the two outer columns balance;
  // the right column keeps Flash + Calendar + Global (all height-capped/scrollable).
  const WideLeft = (
    <div style={{ ...col }}>
      <HotRanking maxHeight={620} />
      <TrendingBox maxHeight={150} />
    </div>
  )
  const WideRight = (
    <div style={{ ...col }}>
      <FlashFeed maxHeight={300} />
      <CalendarBox maxHeight={300} />
      <GlobalMarkets maxHeight={220} />
    </div>
  )

  return (
    <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 1800, margin: '0 auto' }}>
      {mobile ? (
        <div style={{ ...col }}>
          <HotRanking />
          {Mid}
          {Side}
        </div>
      ) : wide ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px,1.1fr) minmax(0,2.4fr) minmax(300px,1.1fr)', gap: 10, alignItems: 'start' }}>
          {WideLeft}
          {Mid}
          {WideRight}
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px,1fr) minmax(0,1.7fr)', gap: 10, alignItems: 'start' }}>
            <HotRanking maxHeight={720} />
            {Mid}
          </div>
          {Side}
        </>
      )}

      <CategoryBoards />
      <BrowseBySource />
    </div>
  )
}
