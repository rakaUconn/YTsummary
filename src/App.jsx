import { useState } from 'react'

export default function App() {
  const [url, setUrl] = useState('')
  const [summary, setSummary] = useState('')
  const [loading, setLoading] = useState(false)

  const getVideoId = (url) => {
    const match = url.match(/(?:v=|\/)([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Step 1: Get YouTube video data
      const videoId = getVideoId(url)
      if (!videoId) {
        setSummary('Invalid YouTube URL')
        setLoading(false)
        return
      }
      
      const ytResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${import.meta.env.VITE_YOUTUBE_API_KEY}`
      )
      if (!ytResponse.ok) {
        throw new Error('YouTube API error')
      }
      const ytData = await ytResponse.json()
      if (!ytData.items.length) {
        setSummary('Video not found')
        setLoading(false)
        return
      }
      const transcript = ytData.items[0].snippet.description

      // Step 2: Generate summary with OpenAI
      const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "user",
            content: `Summarize this video content: ${transcript}`
          }]
        })
      })
      
      if (!aiResponse.ok) {
        throw new Error('OpenAI API error')
      }
      const aiData = await aiResponse.json()
      setSummary(aiData.choices[0].message.content)
    } catch (error) {
      console.error('Error:', error)
      setSummary('Error generating summary: ' + error.message)
    }
    setLoading(false)
  }

  return (
    &lt;div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}&gt;
      &lt;h1&gt;YouTube Summary AI&lt;/h1&gt;
      &lt;form onSubmit={handleSubmit}&gt;
        &lt;input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter YouTube URL"
          style={{ width: '70%', padding: '8px' }}
        /&gt;
        &lt;button
          type="submit"
          disabled={loading}
          style={{ marginLeft: '10px', padding: '8px 16px' }}
        &gt;
          {loading ? 'Processing...' : 'Generate Summary'}
        &lt;/button&gt;
      &lt;/form&gt;
      {summary && (
        &lt;div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ddd' }}&gt;
          &lt;h3&gt;Summary:&lt;/h3&gt;
          &lt;p&gt;{summary}&lt;/p&gt;
        &lt;/div&gt;
      )}
    &lt;/div&gt;
  )
}
