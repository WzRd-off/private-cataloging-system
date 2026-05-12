import { db } from '../database/database.js'
import { GoogleGenerativeAI } from '@google/generative-ai'

class RecomendationController {
    async generateRecommendations(req, res) {
        try {
            const userId = req.user.id
            const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

            if (!apiKey) {
                return res.status(500).json({
                    message: 'Не налаштовано ключ Gemini API (GEMINI_API_KEY)'
                })
            }

            const { rows: books } = await db.query(
                `SELECT
                    ub.title,
                    COALESCE(a.name, 'Невідомий автор') AS author,
                    COALESCE(g.name, 'Невідомий жанр') AS genre,
                    COALESCE(ub.description, '') AS description,
                    ub.cover_url,
                    ub.rating
                 FROM user_books ub
                 LEFT JOIN authors a ON ub.author_id = a.id
                 LEFT JOIN genres g ON ub.genre_id = g.id
                 WHERE ub.user_id = $1
                 ORDER BY ub.created_at DESC NULLS LAST, ub.id DESC`,
                [userId]
            )

            if (books.length === 0) {
                return res.status(400).json({
                    message: 'У вашій бібліотеці немає книг для побудови рекомендацій'
                })
            }

            const formattedBooks = books.map((book, index) => ({
                index: index + 1,
                title: book.title,
                author: book.author,
                genre: book.genre,
                description: book.description,
                cover_url: book.cover_url,
                rating: book.rating
            }))

            const genAI = new GoogleGenerativeAI(apiKey)
            const model = genAI.getGenerativeModel({
                model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
                systemInstruction: `ACT AS A RAW DATA GENERATOR.
OUTPUT DISCIPLINE:
- ONLY VALID JSON.
- NO MARKDOWN (NO \`\`\`json), NO CHAT, NO PREAMBLE, NO POSTAMBLE.
- LANGUAGE: UKRAINIAN.

DATA STRUCTURE:
{
  "recommendations": [
    {
      "title": "string",
      "author": "string",
      "genre": "string",
      "description": "string (logic-based explanation)",
      "cover_url": "string (URL or empty)"
    }
  ]
}

CONSTRAINTS:
1. QUANTITY: Exactly 6 to 8 items.
2. TYPES: All fields are required strings.
3. FORBIDDEN: Do not invent cover_urls. If unknown, use "".
4. STRICTNESS: Any text outside the JSON braces will cause a system failure. Follow the schema or die.`,
                generationConfig: {
                    responseMimeType: 'application/json'
                }
            })

            const prompt = `Ось бібліотека користувача у JSON-форматі:
${JSON.stringify(formattedBooks, null, 2)}

Сгенерируй персонализированные рекомендации в указанном JSON-формате.`

            const result = await model.generateContent(prompt)
            const response = await result.response
            const text = response.text()

            if (!text?.trim()) {
                return res.status(502).json({
                    message: 'Gemini повернув порожню відповідь'
                })
            }

            return res.json({
                recommendations: text
            })
        } catch (error) {
            console.error('Помилка генерації рекомендацій:', error)

            const errorMessage = String(error?.message || '')
            if (errorMessage.includes('API key') || errorMessage.includes('permission')) {
                return res.status(502).json({
                    message: 'Помилка доступу до Gemini API. Перевірте ключ і права доступу.'
                })
            }

            return res.status(500).json({
                message: 'Не вдалося згенерувати рекомендації'
            })
        }
    }
}

export default new RecomendationController()