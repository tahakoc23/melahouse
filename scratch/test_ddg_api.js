async function testDuckDuckGoJsonApi(query) {
  const cleanQuery = query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/gi, ' ').trim();
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(`site:trendyol.com kadin ${cleanQuery}`)}&format=json&no_html=1&no_redirect=1`;

  try {
    const res = await fetch(url);
    console.log(`DDG API Status: ${res.status}`);
    if (res.ok) {
      const json = await res.json();
      console.log("Abstract:", json.Abstract);
      console.log("RelatedTopics count:", json.RelatedTopics?.length);
      if (json.RelatedTopics) {
        json.RelatedTopics.forEach((topic, idx) => {
          if (topic.FirstURL && topic.FirstURL.includes('trendyol.com')) {
            console.log(`${idx + 1}. ${topic.Text} -> ${topic.FirstURL}`);
          }
        });
      }
    }
  } catch (err) {
    console.error("DDG API Error:", err.message);
  }
}

testDuckDuckGoJsonApi('tulum mint');
