export class LLMService {
    private LLM_BASE_URL: string;
    private LLM_API_KEY: string;
    private LLM_MODEL: string;
  
    constructor() {
      if (
        !process.env.LLM_API_KEY ||
        !process.env.LLM_BASE_URL ||
        !process.env.LLM_MODEL
      ) {
        throw new Error("LLM_API_KEY, LLM_BASE_URL, and LLM_MODEL are not set");
      }
      this.LLM_BASE_URL = process.env.LLM_BASE_URL;
      this.LLM_API_KEY = process.env.LLM_API_KEY;
      this.LLM_MODEL = process.env.LLM_MODEL;
    }
  async getLLMResponse<T>(prompt: string, outputSchema: string): Promise<T> {
      prompt += `
      Respond in JSON format matching the schema for ${outputSchema}.
      Schema:
      ${outputSchema}
      `;
      const response = await fetch(`${this.LLM_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: this.LLM_MODEL,
          messages: [
            {
              role: "system",
              content: prompt,
            },
          ],
          temperature: 0.7,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to get response from LLM");
      }
      const result = await response.json();
      const content = result.choices[0].message.content;
      try {
        // Parse the JSON response
        const parsedContent = JSON.parse(content.replace(/```json\n|```/g, ""));
        return parsedContent as T;
      } catch (error) {
        throw new Error("Failed to parse LLM response");
      }
    }
  
  }