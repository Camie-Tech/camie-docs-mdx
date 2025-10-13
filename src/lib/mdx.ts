import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export interface DocPage {
  slug: string[]
  title: string
  description?: string
  content: string
  frontmatter: Record<string, any>
}

export function getAllDocPages(contentDir: string = 'src/content'): DocPage[] {
  const pages: DocPage[] = []
  
  function walkDir(dir: string, basePath: string[] = []) {
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        walkDir(fullPath, [...basePath, item])
      } else if (item.endsWith('.mdx')) {
        const fileContent = fs.readFileSync(fullPath, 'utf8')
        const { data, content } = matter(fileContent)
        const slug = [...basePath, item.replace('.mdx', '')]
        
        pages.push({
          slug,
          title: data.title || slug.join(' '),
          description: data.description,
          content,
          frontmatter: data
        })
      }
    }
  }
  
  walkDir(contentDir)
  return pages
}

export function getDocPage(slug: string[]): DocPage | null {
  const allPages = getAllDocPages()
  return allPages.find(page => 
    page.slug.length === slug.length && 
    page.slug.every((part, i) => part === slug[i])
  ) || null
}