import { useMemo, useState } from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import type { Paper } from "./Types";

type ChatRole = "user" | "assistant";

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type ChatResponse = {
  reply: string;
  sourceLabel?: string;
};

const CHAT_ENDPOINT = process.env.REACT_APP_PUBLICATION_CHAT_ENDPOINT?.trim() || "";

function normalizePaperForChat(paper: Paper) {
  return {
    id: paper.id,
    title: paper.title,
    year: paper.year,
    status: paper.status,
    type: paper.type,
    abstract: paper.abstract || "",
    summary: paper.summary || "",
    pdf: paper.pdf || "",
    preprint: paper.preprint || "",
    tags: paper.tags || [],
    authors: Array.isArray(paper.author)
      ? paper.author.map((a) => `${a.given} ${a.family}`)
      : [],
  };
}

export default function PublicationChat(props: { paper: Paper }) {
  const { paper } = props;

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me about this paper. I will answer using the data and, when available, the paper PDF or preprint source.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const disabledReason = useMemo(() => {
    if (!CHAT_ENDPOINT) {
      return "Chat endpoint is not configured yet.";
    }
    return "";
  }, []);

  async function sendMessage() {
    const question = input.trim();
    if (!question || loading) return;

    if (!CHAT_ENDPOINT) {
      setError("Missing REACT_APP_PUBLICATION_CHAT_ENDPOINT in the frontend environment.");
      return;
    }

    const nextUserMessage: ChatMessage = { role: "user", content: question };
    const nextMessages = [...messages, nextUserMessage];

    setMessages(nextMessages);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const response = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paper: normalizePaperForChat(paper),
          history: nextMessages
            .filter((m) => m.role === "user" || m.role === "assistant")
            .slice(-8),
          userMessage: question,
        }),
      });

      const data = (await response.json()) as ChatResponse & { error?: string };

      if (!response.ok) {
        throw new Error(data.error || "Failed to get a response from the chat service.");
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.sourceLabel
            ? `${data.reply}\n\n_Source: ${data.sourceLabel}_`
            : data.reply,
        },
      ]);
    } catch (err: any) {
      setError(err?.message || "Unknown error.");
      setMessages((prev) => prev.slice(0, -1));
      setInput(question);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="publication-chat-shell">
      <div className="publication-chat-note">
        This chat is grounded in this paper’s YAML metadata and available source text only.
      </div>

      {disabledReason && <Alert variant="warning" className="mb-3">{disabledReason}</Alert>}
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}

      <div className="publication-chat-messages">
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`publication-chat-bubble publication-chat-${message.role}`}
          >
            <div className="publication-chat-role">
              {message.role === "assistant" ? "Paper Assistant" : "You"}
            </div>
            <div className="publication-chat-text">{message.content}</div>
          </div>
        ))}

        {loading && (
          <div className="publication-chat-loading">
            <Spinner animation="border" size="sm" /> Thinking...
          </div>
        )}
      </div>

      <Form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <Form.Group className="mb-2">
          <Form.Control
            as="textarea"
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="For example: What is the main contribution of this paper?"
            disabled={loading || !CHAT_ENDPOINT}
          />
        </Form.Group>

        <div className="publication-chat-actions">
          <Button
            type="submit"
            disabled={loading || !input.trim() || !CHAT_ENDPOINT}
          >
            Ask
          </Button>
          <Button
            variant="outline-secondary"
            disabled={loading}
            onClick={() =>
              setMessages([
                {
                  role: "assistant",
                  content:
                    "Ask me about this paper. I will answer using the YAML metadata and, when available, the paper PDF or preprint source.",
                },
              ])
            }
          >
            Reset
          </Button>
        </div>
      </Form>
    </div>
  );
}