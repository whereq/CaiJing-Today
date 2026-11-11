import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Category from './pages/Category'
import Article from './pages/Article'
import Search from './pages/Search'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="category/:cat" element={<Category />} />
        <Route path="article/:id" element={<Article />} />
        <Route path="search" element={<Search />} />
      </Route>
    </Routes>
  )
}
