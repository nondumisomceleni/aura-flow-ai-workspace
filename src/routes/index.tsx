import { useState, useRef, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Mail, CalendarCheck, ListChecks, Search, Send, Sparkles, Phone, Video, MoreVertical, Smile, Paperclip } from "lucide-react";
import { sendChat } from "@/lib/ai-chat.functions";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AuraFlow AI — Workplace Productivity Assistant" },
      { name: "description", content: "Pink & gold AI workspace for emails, meeting summaries, task planning, and research — in a familiar chat experience." },
      { property: "og:title", content: "AuraFlow AI" },
      { property: "og:description", content: "Your elegant AI workplace companion." },
    ],
  }),
  component: AuraFlow,
});

type Workspace = "email" | "meeting" | "tasks" | "research";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  time: string;
};

const WORKSPACES: {
  key: Workspace;
  name: string;
  tagline: string;
  icon: typeof Mail;
  greeting: string;
  prompts: string[];
}[] = [
  {
    key: "email",
    name: "Email Studio",
    tagline: "Drafts & replies, instantly",
    icon: Mail,
    greeting: "Hey there ✨ I can draft, rewrite, or polish any email. What are we writing today?",
    prompts: [
      "Write a professional follow-up email after a business meeting.",
      "Rewrite this email to sound friendly but confident.",
      "Draft a polite decline to a vendor proposal.",
    ],
  },
  {
    key: "meeting",
    name: "Meeting Notes",
    tagline: "Summaries & action items",
    icon: CalendarCheck,
    greeting: "Drop your transcript or notes here — I'll pull the TL;DR, decisions, and action items.",
    prompts: [
      "Summarize this meeting transcript into key points and action items.",
      "List decisions and owners from these notes.",
      "Turn this discussion into a 5-bullet recap.",
    ],
  },
  {
    key: "tasks",
    name: "Task Planner",
    tagline: "Plans & priorities",
    icon: ListChecks,
    greeting: "Ready to design your day. Tell me your goals and constraints.",
    prompts: [
      "Create a productivity schedule for my workday from 8 AM to 5 PM.",
      "Plan a focused week to ship a product launch.",
      "Turn these 12 tasks into a prioritized to-do list.",
    ],
  },
  {
    key: "research",
    name: "Research Desk",
    tagline: "Briefings & summaries",
    icon: Search,
    greeting: "I'll dig in and bring back a tight, structured briefing. What's the topic?",
    prompts: [
      "Research AI trends in workplace automation and summarize them.",
      "Compare Notion AI, ChatGPT, and Gemini for team use.",
      "Brief me on best practices for prompt engineering.",
    ],
  },
];

const now = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

function AuraFlow() {
  const [active, setActive] = useState<Workspace>("email");
  const [threads, setThreads] = useState<Record<Workspace, Message[]>>(() => {
    const init: Record<string, Message[]> = {};
    WORKSPACES.forEach((w) => {
      init[w.key] = [
        { id: `${w.key}-greet`, role: "assistant", content: w.greeting, time: now() },
      ];
    });
    return init as Record<Workspace, Message[]>;
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const callSendChat = useServerFn(sendChat);

  const activeWs = WORKSPACES.find((w) => w.key === active)!;
  const messages = threads[active];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, active]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      time: now(),
    };
    const nextThread = [...messages, userMsg];
    setThreads((t) => ({ ...t, [active]: nextThread }));
    setInput("");
    setLoading(true);

    try {
      const history = nextThread
        .filter((m) => !m.id.endsWith("-greet"))
        .map((m) => ({ role: m.role, content: m.content }));
      const { reply } = await callSendChat({
        data: { workspace: active, messages: history },
      });
      setThreads((t) => ({
        ...t,
        [active]: [
          ...t[active],
          { id: `a-${Date.now()}`, role: "assistant", content: reply, time: now() },
        ],
      }));
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Top brand bar */}
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-gradient-aura shadow-aura">
              <Sparkles className="h-4.5 w-4.5 text-primary-foreground" strokeWidth={2.4} />
            </div>
            <div>
              <h1 className="text-lg leading-none">
                <span className="text-gradient-aura">AuraFlow</span>{" "}
                <span className="text-foreground/70 font-sans text-xs tracking-widest uppercase">AI</span>
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5">Workplace productivity, beautifully assisted</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex h-2 w-2 rounded-full bg-gold animate-pulse" />
            AI-generated responses — please review before use
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 md:grid-cols-[320px_1fr]">
        {/* Sidebar — chat list */}
        <aside className="rounded-3xl border border-border/60 bg-sidebar shadow-soft overflow-hidden">
          <div className="border-b border-border/60 p-4">
            <h2 className="font-display text-xl">Workspaces</h2>
            <p className="text-xs text-muted-foreground">Pick a chat to start</p>
          </div>
          <nav className="p-2">
            {WORKSPACES.map((w) => {
              const Icon = w.icon;
              const last = threads[w.key][threads[w.key].length - 1];
              const isActive = w.key === active;
              return (
                <button
                  key={w.key}
                  onClick={() => setActive(w.key)}
                  className={`group mb-1 flex w-full items-center gap-3 rounded-2xl p-3 text-left transition-all ${
                    isActive
                      ? "bg-sidebar-accent shadow-soft"
                      : "hover:bg-sidebar-accent/50"
                  }`}
                >
                  <div className={`grid h-11 w-11 place-items-center rounded-2xl transition-transform group-hover:scale-105 ${
                    isActive ? "bg-gradient-aura text-primary-foreground shadow-aura" : "bg-secondary text-foreground"
                  }`}>
                    <Icon className="h-5 w-5" strokeWidth={2} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="truncate text-sm font-semibold">{w.name}</p>
                      <span className="ml-2 shrink-0 text-[10px] text-muted-foreground">{last.time}</span>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {last.role === "assistant" ? "AuraFlow: " : "You: "}
                      {last.content}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          <div className="m-3 mt-2 rounded-2xl border border-gold/40 bg-gradient-to-br from-background to-secondary/60 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-gold" />
              <p className="text-xs font-semibold tracking-wide uppercase text-gold-foreground/80">Pro tip</p>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Paste raw content — emails, notes, transcripts — and ask AuraFlow to transform it.
            </p>
          </div>
        </aside>

        {/* Chat panel */}
        <section className="flex h-[calc(100vh-9rem)] flex-col overflow-hidden rounded-3xl border border-border/60 bg-card shadow-soft">
          {/* Chat header */}
          <div className="flex items-center justify-between border-b border-border/60 bg-background/60 px-5 py-3 backdrop-blur">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-aura text-primary-foreground shadow-aura">
                <activeWs.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-display text-lg leading-tight">{activeWs.name}</p>
                <p className="text-xs text-muted-foreground">{activeWs.tagline} · <span className="text-primary">online</span></p>
              </div>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <button className="rounded-full p-2 hover:bg-secondary"><Phone className="h-4 w-4" /></button>
              <button className="rounded-full p-2 hover:bg-secondary"><Video className="h-4 w-4" /></button>
              <button className="rounded-full p-2 hover:bg-secondary"><MoreVertical className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="chat-pattern flex-1 space-y-3 overflow-y-auto px-4 py-5 sm:px-6">
            {messages.map((m) => (
              <MessageBubble key={m.id} m={m} />
            ))}
            {loading && <Typing />}
          </div>

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 border-t border-border/60 bg-background/60 px-4 py-3 sm:px-6">
              {activeWs.prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => send(p)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground/80 transition-all hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-end gap-2 border-t border-border/60 bg-background/80 px-3 py-3 sm:px-4"
          >
            <button type="button" className="rounded-full p-2.5 text-muted-foreground hover:bg-secondary">
              <Smile className="h-5 w-5" />
            </button>
            <button type="button" className="rounded-full p-2.5 text-muted-foreground hover:bg-secondary">
              <Paperclip className="h-5 w-5" />
            </button>
            <div className="relative flex-1">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send(input);
                  }
                }}
                placeholder={`Message ${activeWs.name}…`}
                rows={1}
                className="max-h-40 w-full resize-none rounded-2xl border border-border bg-card px-4 py-2.5 text-sm shadow-inner outline-none transition-all focus:border-primary/60 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-aura text-primary-foreground shadow-aura transition-transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              aria-label="Send"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </section>
      </div>

      <Toaster position="top-center" />
    </div>
  );
}

function MessageBubble({ m }: { m: Message }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-soft animate-in fade-in slide-in-from-bottom-1 ${
          isUser
            ? "bg-chat-outgoing text-foreground rounded-br-sm"
            : "bg-chat-incoming text-foreground rounded-bl-sm border border-border/60"
        }`}
      >
        <p className="whitespace-pre-wrap">{m.content}</p>
        <p className={`mt-1 text-[10px] ${isUser ? "text-foreground/50" : "text-muted-foreground"} text-right`}>
          {m.time}
        </p>
      </div>
    </div>
  );
}

function Typing() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-border/60 bg-chat-incoming px-4 py-3 shadow-soft">
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
      </div>
    </div>
  );
}
