import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Spinner } from "react-bootstrap";
import { useLocation } from "react-router-dom";
import { loadYamlFile } from "./data";

type ChatRole = "user" | "assistant";
type Mood = "neutral" | "happy" | "sad" | "angry" | "surprised" | "thinking" | "shy";

type ReplySegment = {
  text: string;
  mood: Mood;
  holdMs?: number;
};

type ChatMessage = {
  role: ChatRole;
  content: string;
  mood?: Mood;
  segments?: ReplySegment[];
};

type SiteChatResponse = {
  reply: string;
  mood?: Mood;
  segments?: ReplySegment[];
  speakingMs?: number;
  mouthStrength?: number;
};

type SiteKnowledge = {
  profile: Record<string, any> | null;
  research: Array<Record<string, any>>;
  publications: Array<Record<string, any>>;
  education: Array<Record<string, any>>;
  work: Array<Record<string, any>>;
  teaching: Array<Record<string, any>>;
  service: Array<Record<string, any>>;
  news: Array<Record<string, any>>;
};

declare global {
  interface Window {
    PIXI?: any;
    __siteAssistantScriptsPromise?: Promise<void>;
  }
}

const STORAGE_MESSAGES_KEY = "site-assistant-messages-v2";
const STORAGE_OPEN_KEY = "site-assistant-open-v2";

const PUBLICATION_ENDPOINT = process.env.REACT_APP_PUBLICATION_CHAT_ENDPOINT?.trim() || "";
const SITE_CHAT_ENDPOINT =
  process.env.REACT_APP_SITE_CHAT_ENDPOINT?.trim() ||
  (PUBLICATION_ENDPOINT
    ? PUBLICATION_ENDPOINT.replace(/\/api\/publication-chat\/?$/, "/api/site-chat")
    : "");

const MODEL_URL = `${process.env.PUBLIC_URL}/live2d/tb412/tb412775207.model3.json`;

/**
 * 这些参数后面你只需要改这里
 */
const FIGURE_W = 420;
const FIGURE_H = 620;

const DIALOG_LEFT = 70;
const DIALOG_BOTTOM = 205;

const MINI_BUBBLE_LEFT = 28;
const MINI_BUBBLE_BOTTOM = 235;

const FIT_PADDING_X = 24;
const FIT_PADDING_Y = 16;

/* 这个模型不要再用 bounds 自动缩放了，直接固定 */
const MODEL_SCALE = 0.155;
const MODEL_X_RATIO = 0.20;
const MODEL_Y_RATIO = 0.50;

/**
 * 这个值越大，人物越容易只剩脸
 * 你现在先用 0.42，更稳
 */
const CHARACTER_ZOOM = 0.54;

/**
 * 人物摆放位置
 */
const CHARACTER_CENTER_X = 0.47;
const CHARACTER_BASE_Y = 0.90;

const QUICK_PROMPTS = [
  "介绍一下你自己",
  "你的研究方向是什么？",
  "帮我快速看懂这个主页",
  "What is your recent research focus?",
];

const EXPRESSION_NAME_TO_INDEX = {
  exp1: 0,
  exp2: 1,
  exp3: 2,
  exp4: 3,
  exp5: 4,
  exp6: 5,
  exp7: 6,
} as const;

/**
 * 这里先按 1~7 的顺序映射。
 * 如果你后面发现 happy / sad / angry 对不上，
 * 只改这里，不用动别的逻辑。
 */
const MOOD_TO_EXPRESSION_NAME: Record<Mood, keyof typeof EXPRESSION_NAME_TO_INDEX> = {
  angry: "exp1",
  neutral: "exp2",
  surprised: "exp3",
  thinking: "exp4",
  happy: "exp5",
  shy: "exp6",
  sad: "exp7",
};

const EXPRESSION_PARAMS = [
  "Param1",
  "Param2",
  "Param3",
  "Param4",
  "Param5",
  "Param6",
  "Param7",
] as const;

const MOOD_TO_PARAM_FALLBACK: Record<Mood, string> = {
  angry: "Param1",
  neutral: "Param2",
  surprised: "Param3",
  thinking: "Param4",
  happy: "Param5",
  shy: "Param6",
  sad: "Param7",
};




function getInitialMessages(): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_MESSAGES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  return [
    {
      role: "assistant",
      content: "小源：你好呀，我可以介绍主页内容，也可以直接和你聊天。",
      mood: "neutral",
    },
  ];
}

function normalizeArray<T = any>(data: any, keys: string[] = []): T[] {
  if (Array.isArray(data)) return data as T[];
  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key] as T[];
  }
  return [];
}

function trimText(value: any, maxLength = 280): string {
  const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function compactSiteKnowledge(raw: {
  profile: any;
  research: any;
  publications: any;
  education: any;
  work: any;
  teaching: any;
  service: any;
  news: any;
}): SiteKnowledge {
  const publications = normalizeArray<any>(raw.publications).map((paper) => ({
    id: paper.id,
    title: paper.title,
    year: paper.year,
    venueShort: paper.venueShort || paper.booktitle || paper.journal || paper.publisher || "",
    status: paper.status || "",
    tags: Array.isArray(paper.tags) ? paper.tags.slice(0, 6) : [],
    summary: trimText(paper.summary || paper.abstract || "", 320),
  }));

  return {
    profile: raw.profile
      ? {
          name: raw.profile.name,
          title: raw.profile.title,
          affiliation: raw.profile.affiliation,
          advisor: raw.profile.advisor,
          location: raw.profile.location,
          office: raw.profile.office,
          email: raw.profile.email,
          bio: Array.isArray(raw.profile.bio) ? raw.profile.bio.slice(0, 6) : [],
          interests: Array.isArray(raw.profile.interests) ? raw.profile.interests.slice(0, 12) : [],
          socials: Array.isArray(raw.profile.socials)
            ? raw.profile.socials.map((item: any) => ({ label: item.label, url: item.url }))
            : [],
        }
      : null,
    research: normalizeArray<any>(raw.research).map((item) => ({
      title: item.title,
      description: trimText(item.description, 320),
      keywords: Array.isArray(item.keywords) ? item.keywords.slice(0, 8) : [],
      bullets: Array.isArray(item.bullets) ? item.bullets.slice(0, 6) : [],
    })),
    publications,
    education: normalizeArray<any>(raw.education).map((item) => ({
      degree: item.degree,
      department: item.department,
      school: item.school,
      period: item.period,
      thesis: item.thesis || "",
    })),
    work: normalizeArray<any>(raw.work).map((item) => ({
      title: item.title,
      affiliation: item.affiliation,
      city: item.city,
      country: item.country,
      begin: item.begin,
      end: item.end,
      summary: trimText(item.summary, 220),
    })),
    teaching: normalizeArray<any>(raw.teaching).map((item) => ({
      title: item.title,
      course: item.course,
      school: item.school,
      date: item.date,
    })),
    service: normalizeArray<any>(raw.service, ["service", "items"]).map((item) => ({
      title: item.title,
      venue: item.venue,
      date: item.date,
    })),
    news: normalizeArray<any>(raw.news).map((item) => ({
      date: item.date,
      title: item.title,
      description: trimText(item.description, 220),
    })),
  };
}

async function loadAssistantScripts() {
  if (window.__siteAssistantScriptsPromise) return window.__siteAssistantScriptsPromise;

  const loadScript = (srcCandidates: string[]) =>
    new Promise<void>((resolve, reject) => {
      const tryNext = (index: number) => {
        if (index >= srcCandidates.length) {
          reject(new Error("Failed to load required Live2D script."));
          return;
        }

        const src = srcCandidates[index];
        const existing = document.querySelector(
          `script[data-site-assistant="${src}"]`
        ) as HTMLScriptElement | null;

        if (existing) {
          if (existing.dataset.loaded === "1") {
            resolve();
            return;
          }
          existing.addEventListener("load", () => resolve(), { once: true });
          existing.addEventListener("error", () => tryNext(index + 1), { once: true });
          return;
        }

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.dataset.siteAssistant = src;
        script.onload = () => {
          script.dataset.loaded = "1";
          resolve();
        };
        script.onerror = () => {
          script.remove();
          tryNext(index + 1);
        };
        document.head.appendChild(script);
      };

      tryNext(0);
    });

  window.__siteAssistantScriptsPromise = (async () => {
    await loadScript([
      "https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js",
      "https://unpkg.com/pixi.js@6.5.10/dist/browser/pixi.min.js",
    ]);

    await loadScript([
      `${process.env.PUBLIC_URL}/live2d/vendor/live2dcubismcore.min.js`,
      "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js",
    ]);

    await loadScript([
      "https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism4.min.js",
      "https://unpkg.com/pixi-live2d-display@0.4.0/dist/cubism4.min.js",
    ]);
  })();

  return window.__siteAssistantScriptsPromise;
}

function inferMoodFromText(text: string): Mood {
  const t = text.toLowerCase();

  if (/抱歉|sorry|遗憾|出错|失败|cannot|can't|unable|error/.test(t)) return "sad";
  if (/恭喜|太好了|great|awesome|glad|happy|当然可以|没问题/.test(t)) return "happy";
  if (/震惊|惊讶|surpris|what\?|really\?/.test(t)) return "surprised";
  if (/让我想想|思考|thinking|analyz|let me think/.test(t)) return "thinking";
  if (/生气|angry|annoy|frustrat/.test(t)) return "angry";

  return "neutral";
}

function normalizeMoodValue(value: any, fallback: Mood = "neutral"): Mood {
  const allowed: Mood[] = [
    "neutral",
    "happy",
    "sad",
    "angry",
    "surprised",
    "thinking",
    "shy",
  ];
  return allowed.includes(value) ? value : fallback;
}

function splitReplyIntoSegments(text: string): string[] {
  const raw = String(text || "").trim();
  if (!raw) return [];

  const parts =
    raw
      .match(/[^。！？!?；;，,\n]+[。！？!?；;，,\n]*/g)
      ?.map((s) => s.trim())
      .filter(Boolean) || [];

  return parts.length ? parts : [raw];
}

function estimateSegmentHoldMs(text: string, mood: Mood = "neutral"): number {
  const clean = String(text || "").trim();
  const len = clean.length;

  const punctuationBoost = /[!?！？]/.test(clean) ? 180 : /[,，;；]/.test(clean) ? 80 : 0;

  const moodFactor: Record<Mood, number> = {
    neutral: 1.0,
    happy: 0.95,
    sad: 1.08,
    angry: 0.9,
    surprised: 0.88,
    thinking: 1.12,
    shy: 1.05,
  };

  const base = 650 + len * 42 + punctuationBoost;
  return Math.max(700, Math.min(2600, Math.round(base * moodFactor[mood])));
}

function moodToMouthStrength(mood: Mood): number {
  return {
    neutral: 0.68,
    happy: 0.82,
    sad: 0.5,
    angry: 0.88,
    surprised: 0.92,
    thinking: 0.58,
    shy: 0.52,
  }[mood];
}

function normalizeReplySegments(
  segments: any,
  reply: string,
  fallbackMood: Mood
): ReplySegment[] {
  if (Array.isArray(segments)) {
    const cleaned = segments
      .map((seg) => ({
        text: String(seg?.text || "").trim(),
        mood: normalizeMoodValue(seg?.mood, fallbackMood),
        holdMs:
          typeof seg?.holdMs === "number" && Number.isFinite(seg.holdMs)
            ? Math.max(500, Math.min(3000, Math.round(seg.holdMs)))
            : undefined,
      }))
      .filter((seg) => seg.text);

    if (cleaned.length) return cleaned;
  }

  return splitReplyIntoSegments(reply).map((text) => ({
    text,
    mood: fallbackMood,
    holdMs: estimateSegmentHoldMs(text, fallbackMood),
  }));
}

function resetExpressionParams(coreModel: any) {
  for (const paramId of [
    "Param7",
    "Param8",
    "Param9",
    "Param10",
    "Param11",
    "Param12",
    "Param13",
  ]) {
    try {
      coreModel.setParameterValueById(paramId, 0);
    } catch {}
  }
}

function getExpressionManager(model: any) {
  return (
    model?.internalModel?.motionManager?.expressionManager ||
    model?.internalModel?.expressionManager ||
    null
  );
}

function fitModelToCanvas(model: any, app: any) {
  const bounds = model?.getLocalBounds?.();

  if (model?.anchor?.set) {
    model.anchor.set(0.5, 0.5);
  } else if (bounds && bounds.width && bounds.height) {
    model.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  }

  model.scale.set(MODEL_SCALE);
  model.x = app.renderer.width * MODEL_X_RATIO;
  model.y = app.renderer.height * MODEL_Y_RATIO;
}

export default function SiteAssistant() {
  const location = useLocation();

  const [open, setOpen] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_OPEN_KEY) === "1";
    } catch {
      return false;
    }
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialMessages());
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [knowledge, setKnowledge] = useState<SiteKnowledge | null>(null);
  const [displayMood, setDisplayMood] = useState<Mood>(
    messages[messages.length - 1]?.mood || "neutral"
  );
  const [live2dReady, setLive2dReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const bubbleMessagesRef = useRef<HTMLDivElement | null>(null);
  const pixiAppRef = useRef<any>(null);
  const live2dModelRef = useRef<any>(null);

  const pointerTargetRef = useRef({ x: 0, y: 0 });
  const pointerCurrentRef = useRef({ x: 0, y: 0 });

  const loadingRef = useRef(false);
  const speakingUntilRef = useRef(0);
  const moodRef = useRef<Mood>(displayMood);
  const mouthStrengthRef = useRef(0.72);
  const segmentTimersRef = useRef<number[]>([]);

  const disabledReason = useMemo(() => {
    if (!SITE_CHAT_ENDPOINT) return "未配置对话接口";
    if (!knowledge) return "正在读取主页内容…";
    return "";
  }, [knowledge]);

  const applyMoodToModel = useCallback((mood: Mood) => {
      const model = live2dModelRef.current;
      const coreModel = model?.internalModel?.coreModel;
      if (!coreModel) return;
    
      const expressionManager = getExpressionManager(model);
      const expressionName = MOOD_TO_EXPRESSION_NAME[mood];
      const expressionIndex = EXPRESSION_NAME_TO_INDEX[expressionName];
    
      let appliedByExpressionManager = false;
    
      /**
       * 先尝试走 expression manager
       */
      if (expressionManager) {
        try {
          if (typeof expressionManager.resetExpression === "function") {
            expressionManager.resetExpression();
          }
        } catch {}
    
        try {
          if (typeof expressionManager.setExpression === "function") {
            expressionManager.setExpression(expressionIndex);
            appliedByExpressionManager = true;
          }
        } catch {}
    
        try {
          if (!appliedByExpressionManager && typeof expressionManager.startExpression === "function") {
            expressionManager.startExpression(expressionIndex);
            appliedByExpressionManager = true;
          }
        } catch {}
      }
  
      /**
       * 如果 expression manager 不可用，或者调用失败，
       * 就回退到直接写 Param7~13
       */
      if (!appliedByExpressionManager) {
        resetExpressionParams(coreModel);
    
        try {
          coreModel.setParameterValueById(MOOD_TO_PARAM_FALLBACK[mood], 1);
        } catch {}
      }
  
      try {
        coreModel.setParameterValueById(
          "ParamCheek",
          mood === "shy" ? 1 : mood === "happy" ? 0.65 : 0.12
        );
      } catch {}
    }, []);

  function testExpression(name: keyof typeof EXPRESSION_NAME_TO_INDEX) {
    const model = live2dModelRef.current;
    const coreModel = model?.internalModel?.coreModel;
    if (!coreModel) return;

    const expressionManager = getExpressionManager(model);
    const index = EXPRESSION_NAME_TO_INDEX[name];

    if (expressionManager) {
      try {
        if (typeof expressionManager.resetExpression === "function") {
          expressionManager.resetExpression();
        }
      } catch {}

      try {
        if (typeof expressionManager.setExpression === "function") {
          expressionManager.setExpression(index);
          return;
        }
      } catch {}

      try {
        if (typeof expressionManager.startExpression === "function") {
          expressionManager.startExpression(index);
          return;
        }
      } catch {}
    }

    resetExpressionParams(coreModel);

    try {
      const ids = ["Param7", "Param8", "Param9", "Param10", "Param11", "Param12", "Param13"];
      coreModel.setParameterValueById(ids[index], 1);
    } catch {}
  }

  useEffect(() => {
    (window as any).testExpression = testExpression;
  }, []);

  const clearSegmentTimers = useCallback(() => {
    segmentTimersRef.current.forEach((id) => window.clearTimeout(id));
    segmentTimersRef.current = [];
  }, []);

  const playAssistantPerformance = useCallback(
    (
      reply: string,
      segments: ReplySegment[] | undefined,
      fallbackMood: Mood,
      fallbackSpeakingMs?: number,
      fallbackMouthStrength?: number
    ) => {
      clearSegmentTimers();

      const safeSegments = normalizeReplySegments(segments, reply, fallbackMood);

      if (!safeSegments.length) {
        const ms =
          fallbackSpeakingMs ?? Math.max(1400, 900 + Math.max(reply.length, 8) * 28);

        setDisplayMood(fallbackMood);
        moodRef.current = fallbackMood;
        mouthStrengthRef.current =
          fallbackMouthStrength ?? moodToMouthStrength(fallbackMood);
        speakingUntilRef.current = Date.now() + ms;
        return;
      }

      let totalMs = 0;

      safeSegments.forEach((seg) => {
        const segMood = normalizeMoodValue(seg.mood, fallbackMood);
        const holdMs = seg.holdMs ?? estimateSegmentHoldMs(seg.text, segMood);

        const timerId = window.setTimeout(() => {
          setDisplayMood(segMood);
          moodRef.current = segMood;
          mouthStrengthRef.current = moodToMouthStrength(segMood);
        }, totalMs);

        segmentTimersRef.current.push(timerId);
        totalMs += holdMs;
      });

      speakingUntilRef.current = Date.now() + totalMs;

      const settleId = window.setTimeout(() => {
        setDisplayMood(fallbackMood);
        moodRef.current = fallbackMood;
        mouthStrengthRef.current =
          fallbackMouthStrength ?? moodToMouthStrength(fallbackMood);
      }, totalMs + 120);

      segmentTimersRef.current.push(settleId);
    },
    [clearSegmentTimers]
  );

  useEffect(() => {
    moodRef.current = displayMood;
    applyMoodToModel(displayMood);
  }, [displayMood, applyMoodToModel]);

  useEffect(() => {
    return () => {
      clearSegmentTimers();
    };
  }, [clearSegmentTimers]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages.slice(-24)));
    } catch {}
  }, [messages]);

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_OPEN_KEY, open ? "1" : "0");
    } catch {}
  }, [open]);

  useEffect(() => {
    if (!bubbleMessagesRef.current) return;
    bubbleMessagesRef.current.scrollTop = bubbleMessagesRef.current.scrollHeight;
  }, [messages, open, loading]);

  useEffect(() => {
    async function loadAllYaml() {
      try {
        const [profile, research, publications, education, work, teaching, service, news] =
          await Promise.all([
            loadYamlFile<any>("/data/profile.yaml"),
            loadYamlFile<any>("/data/research.yaml"),
            loadYamlFile<any>("/data/publications.yaml"),
            loadYamlFile<any>("/data/education.yaml"),
            loadYamlFile<any>("/data/work.yaml"),
            loadYamlFile<any>("/data/teaching.yaml"),
            loadYamlFile<any>("/data/service.yaml"),
            loadYamlFile<any>("/data/news.yaml"),
          ]);

        setKnowledge(
          compactSiteKnowledge({
            profile,
            research,
            publications,
            education,
            work,
            teaching,
            service,
            news,
          })
        );
      } catch (e) {
        console.error("Failed to load site data:", e);
      }
    }

    loadAllYaml();
  }, []);

  useEffect(() => {
    let disposed = false;
    let fitTimers: number[] = [];
    let handleResize: (() => void) | null = null;

    async function initLive2d() {
      if (!canvasRef.current) return;

      try {
        await loadAssistantScripts();
        if (disposed || !window.PIXI?.live2d?.Live2DModel) return;

        const PIXI = window.PIXI;

        const app = new PIXI.Application({
          view: canvasRef.current,
          autoStart: true,
          backgroundAlpha: 0,
          antialias: true,
          autoDensity: true,
          resolution: Math.min(window.devicePixelRatio || 1, 2),
          width: FIGURE_W,
          height: FIGURE_H,
        });

        pixiAppRef.current = app;

        const Live2DModel = PIXI.live2d.Live2DModel;
        const model = await Live2DModel.from(MODEL_URL, {
          autoInteract: false,
        });

        if (disposed) {
          try {
            app.destroy(true, { children: true, texture: false, baseTexture: false });
          } catch {}
          return;
        }

        live2dModelRef.current = model;
        app.stage.addChild(model);

        const refit = () => {
          if (!disposed && live2dModelRef.current && pixiAppRef.current) {
            fitModelToCanvas(live2dModelRef.current, pixiAppRef.current);
          }
        };

        refit();

        fitTimers = [
          window.setTimeout(refit, 30),
          window.setTimeout(refit, 120),
          window.setTimeout(refit, 400),
          window.setTimeout(refit, 900),
        ];

        setLive2dReady(true);
        applyMoodToModel(moodRef.current);

        app.ticker.add(() => {
          const current = pointerCurrentRef.current;
          const target = pointerTargetRef.current;

          current.x += (target.x - current.x) * 0.12;
          current.y += (target.y - current.y) * 0.12;

          const coreModel = live2dModelRef.current?.internalModel?.coreModel;
          if (!coreModel) return;

        //   applyMoodToModel(moodRef.current);

          const lookX = -current.x;
          const lookY = -current.y;

          try {
            coreModel.setParameterValueById(
              "ParamEyeBallX",
              Math.max(-1, Math.min(1, lookX * 1.0))
            );
          } catch {}

          try {
            coreModel.setParameterValueById(
              "ParamEyeBallY",
              Math.max(-1, Math.min(1, lookY * 1.0))
            );
          } catch {}

          try {
            coreModel.setParameterValueById(
              "ParamAngleX",
              Math.max(-30, Math.min(30, lookX * 26))
            );
          } catch {}

          try {
            coreModel.setParameterValueById(
              "ParamAngleY",
              Math.max(-22, Math.min(22, lookY * 18))
            );
          } catch {}

          try {
            coreModel.setParameterValueById(
              "ParamAngleZ",
              Math.max(-12, Math.min(12, lookX * 8))
            );
          } catch {}

          try {
            coreModel.setParameterValueById(
              "ParamBodyAngleX",
              Math.max(-14, Math.min(14, lookX * 10))
            );
          } catch {}

          const speaking = loadingRef.current || speakingUntilRef.current > Date.now();
          const t = performance.now() / 95;
          const mouthStrength = mouthStrengthRef.current;

          const mouthOpen = speaking
            ? 0.10 + mouthStrength * (0.18 + 0.24 * (0.5 + 0.5 * Math.sin(t)))
            : 0;

          const mouthForm = speaking ? 0.18 : 0;

          try {
            coreModel.setParameterValueById("ParamMouthOpenY", mouthOpen);
          } catch {}

          try {
            coreModel.setParameterValueById("ParamMouthForm", mouthForm);
          } catch {}
        });

        handleResize = () => {
          refit();
        };

        window.addEventListener("resize", handleResize);
      } catch (e) {
        console.error("Live2D init failed:", e);
      }
    }

    initLive2d();

    return () => {
      disposed = true;

      fitTimers.forEach((id) => window.clearTimeout(id));

      if (handleResize) {
        window.removeEventListener("resize", handleResize);
      }

      try {
        pixiAppRef.current?.destroy?.(true, {
          children: true,
          texture: false,
          baseTexture: false,
        });
      } catch {}

      pixiAppRef.current = null;
      live2dModelRef.current = null;
    };
  }, [applyMoodToModel]);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const rawX = (event.clientX / window.innerWidth) * 2 - 1;
      const rawY = (event.clientY / window.innerHeight) * 2 - 1;

      const boostedX = rawX * 1.25;
      const boostedY = rawY * 1.25;

      pointerTargetRef.current = {
        x: Math.max(-1, Math.min(1, boostedX)),
        y: Math.max(-1, Math.min(1, boostedY)),
      };
    };

    const resetLook = () => {
      pointerTargetRef.current = { x: 0, y: 0 };
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", resetLook);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", resetLook);
    };
  }, []);

  function handleResetChat() {
    clearSegmentTimers();

    setMessages([]);
    setInput("");
    setError("");
    setLoading(false);
    setDisplayMood("neutral");

    moodRef.current = "neutral";
    speakingUntilRef.current = 0;
    mouthStrengthRef.current = 0.72;

    try {
      window.localStorage.removeItem(STORAGE_MESSAGES_KEY);
    } catch {}
  }

  async function sendMessage(rawText?: string) {
      const question = (rawText ?? input).trim();
      if (!question || loading || !knowledge) return;
    
      clearSegmentTimers();
    
      const nextUserMessage: ChatMessage = { role: "user", content: question };
      const nextMessages = [...messages, nextUserMessage];
    
      setMessages(nextMessages);
      setInput("");
      setLoading(true);
      setError("");
      setOpen(true);
      setDisplayMood("shy");
    
      moodRef.current = "shy";
      mouthStrengthRef.current = 0.55;
      speakingUntilRef.current = Date.now() + 1000;
    
      try {
        const response = await fetch(SITE_CHAT_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPath: location.pathname,
            siteData: knowledge,
            history: nextMessages.slice(-10),
            userMessage: question,
          }),
        });
    
        const rawText = await response.text();
    
        let data: SiteChatResponse & { error?: string };
        try {
          data = JSON.parse(rawText);
        } catch (parseError) {
          console.error("Invalid JSON response from /api/site-chat:");
          console.error(rawText);
          throw new Error(
            `接口返回的不是合法 JSON。原始返回前200字：${rawText.slice(0, 200)}`
          );
        }
    
        if (!response.ok) {
          throw new Error(data.error || "对话失败");
        }
    
        if (!data.reply || typeof data.reply !== "string") {
          throw new Error("接口返回缺少 reply 字段。");
        }
    
        const finalMood = data.mood || inferMoodFromText(data.reply);
        const normalizedSegments = normalizeReplySegments(data.segments, data.reply, finalMood);
    
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: data.reply,
          mood: finalMood,
          segments: normalizedSegments,
        };
    
        setMessages((prev) => [...prev, assistantMessage]);
    
        playAssistantPerformance(
          data.reply,
          normalizedSegments,
          finalMood,
          data.speakingMs,
          Math.max(0.3, Math.min(1, data.mouthStrength ?? moodToMouthStrength(finalMood)))
        );
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "Unknown error");
        setMessages((prev) => prev.slice(0, -1));
        setInput(question);
        setDisplayMood("sad");
        moodRef.current = "sad";
        mouthStrengthRef.current = 0.45;
        speakingUntilRef.current = Date.now() + 1200;
      } finally {
        setLoading(false);
      }
    }

  return (
    <div className={`site-assistant-root ${open ? "is-open" : ""}`}>
      <div
        className={`site-assistant-dialog-wrap ${open ? "is-visible" : ""}`}
        style={{
          left: `${DIALOG_LEFT}px`,
          bottom: `${DIALOG_BOTTOM}px`,
        }}
      >
        <div className="site-assistant-dialog">
          <button
            type="button"
            className="site-assistant-close-bubble"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
          >
            ×
          </button>

          <div className="site-assistant-dialog-quick">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                className="site-assistant-quick-chip"
                onClick={() => sendMessage(prompt)}
                disabled={loading || !!disabledReason}
              >
                {prompt}
              </button>
            ))}
          </div>

          <div className="site-assistant-dialog-messages" ref={bubbleMessagesRef}>
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`site-assistant-bubble-row ${message.role}`}
              >
                <div className={`site-assistant-bubble ${message.role}`}>
                  {message.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="site-assistant-bubble-row assistant">
                <div className="site-assistant-bubble assistant loading">
                  <Spinner animation="border" size="sm" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="site-assistant-bubble-row assistant">
                <div className="site-assistant-bubble system error">{error}</div>
              </div>
            )}

            {disabledReason && (
              <div className="site-assistant-bubble-row assistant">
                <div className="site-assistant-bubble system note">{disabledReason}</div>
              </div>
            )}
          </div>

          <form
            className="site-assistant-input-row"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <textarea
              className="site-assistant-input"
              rows={2}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="直接问我主页内容，或者自然聊天…"
              disabled={loading || !!disabledReason}
            />

            <div className="site-assistant-input-actions">
              <button
                type="submit"
                className="site-assistant-send"
                disabled={loading || !input.trim() || !!disabledReason}
              >
                Send
              </button>

              <button
                type="button"
                className="site-assistant-reset"
                onClick={handleResetChat}
                disabled={loading}
              >
                Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      <div
        className="site-assistant-figure-layer"
        style={{
          width: `${FIGURE_W}px`,
          height: `${FIGURE_H}px`,
        }}
      >
        <button
          type="button"
          className="site-assistant-figure"
          onClick={() => setOpen(true)}
          aria-label="Open AI chat"
          style={{
            width: `${FIGURE_W}px`,
            height: `${FIGURE_H}px`,
          }}
        >
          <canvas
            ref={canvasRef}
            className="site-assistant-canvas"
            style={{
              width: `${FIGURE_W}px`,
              height: `${FIGURE_H}px`,
            }}
          />
          {!live2dReady && <div className="site-assistant-fallback">AI</div>}
        </button>

        {!open && (
          <button
            type="button"
            className="site-assistant-mini-bubble"
            onClick={() => setOpen(true)}
            style={{
              left: `${MINI_BUBBLE_LEFT}px`,
              bottom: `${MINI_BUBBLE_BOTTOM}px`,
            }}
          >
            和我说话
          </button>
        )}
      </div>
    </div>
  );
}




// import { useCallback, useEffect, useMemo, useRef, useState } from "react";
// import { Spinner } from "react-bootstrap";
// import { useLocation } from "react-router-dom";
// import { loadYamlFile } from "./data";

// type ChatRole = "user" | "assistant";
// type Mood = "neutral" | "happy" | "sad" | "angry" | "surprised" | "thinking" | "shy";


// type ReplySegment = {
//   text: string;
//   mood: Mood;
//   holdMs?: number;
// };

// type ChatMessage = {
//   role: ChatRole;
//   content: string;
//   mood?: Mood;
//   segments?: ReplySegment[];
// };

// type SiteChatResponse = {
//   reply: string;
//   mood?: Mood;
//   segments?: ReplySegment[];
//   speakingMs?: number;
//   mouthStrength?: number;
// };
// // type ChatMessage = {
// //   role: ChatRole;
// //   content: string;
// //   mood?: Mood;
// // };

// // type SiteChatResponse = {
// //   reply: string;
// //   mood?: Mood;
// //   speakingMs?: number;
// //   mouthStrength?: number;
// // };

// type SiteKnowledge = {
//   profile: Record<string, any> | null;
//   research: Array<Record<string, any>>;
//   publications: Array<Record<string, any>>;
//   education: Array<Record<string, any>>;
//   work: Array<Record<string, any>>;
//   teaching: Array<Record<string, any>>;
//   service: Array<Record<string, any>>;
//   news: Array<Record<string, any>>;
// };

// declare global {
//   interface Window {
//     PIXI?: any;
//     __siteAssistantScriptsPromise?: Promise<void>;
//   }
// }

// const STORAGE_MESSAGES_KEY = "site-assistant-messages-v2";
// const STORAGE_OPEN_KEY = "site-assistant-open-v2";

// const PUBLICATION_ENDPOINT = process.env.REACT_APP_PUBLICATION_CHAT_ENDPOINT?.trim() || "";
// const SITE_CHAT_ENDPOINT =
//   process.env.REACT_APP_SITE_CHAT_ENDPOINT?.trim() ||
//   (PUBLICATION_ENDPOINT
//     ? PUBLICATION_ENDPOINT.replace(/\/api\/publication-chat\/?$/, "/api/site-chat")
//     : "");

// const MODEL_URL = `${process.env.PUBLIC_URL}/live2d/tb412/tb412775207.model3.json`;

// /**
//  * 这些参数后面你只需要改这里
//  */
// const FIGURE_W = 420;
// const FIGURE_H = 620;

// const DIALOG_LEFT = 70;
// const DIALOG_BOTTOM = 205;

// const MINI_BUBBLE_LEFT = 28;
// const MINI_BUBBLE_BOTTOM = 235;

// const FIT_PADDING_X = 24;
// const FIT_PADDING_Y = 16;

// /* 这个模型不要再用 bounds 自动缩放了，直接固定 */
// const MODEL_SCALE = 0.155;
// const MODEL_X_RATIO = 0.20;
// const MODEL_Y_RATIO = 0.50;

// /**
//  * 这个值越大，人物越容易只剩脸
//  * 你现在先用 0.42，更稳
//  */
// const CHARACTER_ZOOM = 0.54;


// /**
//  * 人物摆放位置
//  */
// const CHARACTER_CENTER_X = 0.47;
// const CHARACTER_BASE_Y = 0.90;

// const QUICK_PROMPTS = [
//   "介绍一下你自己",
//   "你的研究方向是什么？",
//   "帮我快速看懂这个主页",
//   "What is your recent research focus?",
// ];

// const EMOTION_TO_PARAM: Record<Mood, string> = {
//   neutral: "Param7",
//   happy: "Param8",
//   sad: "Param9",
//   angry: "Param10",
//   surprised: "Param11",
//   thinking: "Param12",
//   shy: "Param13",
// };

// function getInitialMessages(): ChatMessage[] {
//   try {
//     const raw = window.localStorage.getItem(STORAGE_MESSAGES_KEY);
//     if (raw) {
//       const parsed = JSON.parse(raw);
//       if (Array.isArray(parsed) && parsed.length > 0) return parsed;
//     }
//   } catch {}

//   return [
//     {
//       role: "assistant",
//       content: "你好，我可以介绍主页内容，也可以直接和你聊天。",
//       mood: "neutral",
//     },
//   ];
// }

// function normalizeArray<T = any>(data: any, keys: string[] = []): T[] {
//   if (Array.isArray(data)) return data as T[];
//   for (const key of keys) {
//     if (Array.isArray(data?.[key])) return data[key] as T[];
//   }
//   return [];
// }

// function trimText(value: any, maxLength = 280): string {
//   const text = typeof value === "string" ? value.replace(/\s+/g, " ").trim() : "";
//   if (!text) return "";
//   return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
// }

// function compactSiteKnowledge(raw: {
//   profile: any;
//   research: any;
//   publications: any;
//   education: any;
//   work: any;
//   teaching: any;
//   service: any;
//   news: any;
// }): SiteKnowledge {
//   const publications = normalizeArray<any>(raw.publications).map((paper) => ({
//     id: paper.id,
//     title: paper.title,
//     year: paper.year,
//     venueShort: paper.venueShort || paper.booktitle || paper.journal || paper.publisher || "",
//     status: paper.status || "",
//     tags: Array.isArray(paper.tags) ? paper.tags.slice(0, 6) : [],
//     summary: trimText(paper.summary || paper.abstract || "", 320),
//   }));

//   return {
//     profile: raw.profile
//       ? {
//           name: raw.profile.name,
//           title: raw.profile.title,
//           affiliation: raw.profile.affiliation,
//           advisor: raw.profile.advisor,
//           location: raw.profile.location,
//           office: raw.profile.office,
//           email: raw.profile.email,
//           bio: Array.isArray(raw.profile.bio) ? raw.profile.bio.slice(0, 6) : [],
//           interests: Array.isArray(raw.profile.interests) ? raw.profile.interests.slice(0, 12) : [],
//           socials: Array.isArray(raw.profile.socials)
//             ? raw.profile.socials.map((item: any) => ({ label: item.label, url: item.url }))
//             : [],
//         }
//       : null,
//     research: normalizeArray<any>(raw.research).map((item) => ({
//       title: item.title,
//       description: trimText(item.description, 320),
//       keywords: Array.isArray(item.keywords) ? item.keywords.slice(0, 8) : [],
//       bullets: Array.isArray(item.bullets) ? item.bullets.slice(0, 6) : [],
//     })),
//     publications,
//     education: normalizeArray<any>(raw.education).map((item) => ({
//       degree: item.degree,
//       department: item.department,
//       school: item.school,
//       period: item.period,
//       thesis: item.thesis || "",
//     })),
//     work: normalizeArray<any>(raw.work).map((item) => ({
//       title: item.title,
//       affiliation: item.affiliation,
//       city: item.city,
//       country: item.country,
//       begin: item.begin,
//       end: item.end,
//       summary: trimText(item.summary, 220),
//     })),
//     teaching: normalizeArray<any>(raw.teaching).map((item) => ({
//       title: item.title,
//       course: item.course,
//       school: item.school,
//       date: item.date,
//     })),
//     service: normalizeArray<any>(raw.service, ["service", "items"]).map((item) => ({
//       title: item.title,
//       venue: item.venue,
//       date: item.date,
//     })),
//     news: normalizeArray<any>(raw.news).map((item) => ({
//       date: item.date,
//       title: item.title,
//       description: trimText(item.description, 220),
//     })),
//   };
// }

// async function loadAssistantScripts() {
//   if (window.__siteAssistantScriptsPromise) return window.__siteAssistantScriptsPromise;

//   const loadScript = (srcCandidates: string[]) =>
//     new Promise<void>((resolve, reject) => {
//       const tryNext = (index: number) => {
//         if (index >= srcCandidates.length) {
//           reject(new Error("Failed to load required Live2D script."));
//           return;
//         }

//         const src = srcCandidates[index];
//         const existing = document.querySelector(
//           `script[data-site-assistant="${src}"]`
//         ) as HTMLScriptElement | null;

//         if (existing) {
//           if (existing.dataset.loaded === "1") {
//             resolve();
//             return;
//           }
//           existing.addEventListener("load", () => resolve(), { once: true });
//           existing.addEventListener("error", () => tryNext(index + 1), { once: true });
//           return;
//         }

//         const script = document.createElement("script");
//         script.src = src;
//         script.async = true;
//         script.dataset.siteAssistant = src;
//         script.onload = () => {
//           script.dataset.loaded = "1";
//           resolve();
//         };
//         script.onerror = () => {
//           script.remove();
//           tryNext(index + 1);
//         };
//         document.head.appendChild(script);
//       };

//       tryNext(0);
//     });

//   window.__siteAssistantScriptsPromise = (async () => {
//     await loadScript([
//       "https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js",
//       "https://unpkg.com/pixi.js@6.5.10/dist/browser/pixi.min.js",
//     ]);

//     await loadScript([
//       `${process.env.PUBLIC_URL}/live2d/vendor/live2dcubismcore.min.js`,
//       "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js",
//     ]);

//     await loadScript([
//       "https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/cubism4.min.js",
//       "https://unpkg.com/pixi-live2d-display@0.4.0/dist/cubism4.min.js",
//     ]);
//   })();

//   return window.__siteAssistantScriptsPromise;
// }

// function inferMoodFromText(text: string): Mood {
//   const t = text.toLowerCase();

//   if (/抱歉|sorry|遗憾|出错|失败|cannot|can't|unable|error/.test(t)) return "sad";
//   if (/恭喜|太好了|great|awesome|glad|happy|当然可以|没问题/.test(t)) return "happy";
//   if (/震惊|惊讶|surpris|what\?|really\?/.test(t)) return "surprised";
//   if (/让我想想|思考|thinking|analyz|let me think/.test(t)) return "thinking";
//   if (/生气|angry|annoy|frustrat/.test(t)) return "angry";

//   return "neutral";
// }

// function normalizeMoodValue(value: any, fallback: Mood = "neutral"): Mood {
//   const allowed: Mood[] = [
//     "neutral",
//     "happy",
//     "sad",
//     "angry",
//     "surprised",
//     "thinking",
//     "shy",
//   ];
//   return allowed.includes(value) ? value : fallback;
// }

// function splitReplyIntoSegments(text: string): string[] {
//   const raw = String(text || "").trim();
//   if (!raw) return [];

//   const parts =
//     raw
//       .match(/[^。！？!?；;，,\n]+[。！？!?；;，,\n]*/g)
//       ?.map((s) => s.trim())
//       .filter(Boolean) || [];

//   return parts.length ? parts : [raw];
// }

// function estimateSegmentHoldMs(text: string, mood: Mood = "neutral"): number {
//   const clean = String(text || "").trim();
//   const len = clean.length;

//   const punctuationBoost = /[!?！？]/.test(clean) ? 180 : /[,，;；]/.test(clean) ? 80 : 0;

//   const moodFactor: Record<Mood, number> = {
//     neutral: 1.0,
//     happy: 0.95,
//     sad: 1.08,
//     angry: 0.9,
//     surprised: 0.88,
//     thinking: 1.12,
//     shy: 1.05,
//   };

//   const base = 650 + len * 42 + punctuationBoost;
//   return Math.max(700, Math.min(2600, Math.round(base * moodFactor[mood])));
// }

// function moodToMouthStrength(mood: Mood): number {
//   return {
//     neutral: 0.68,
//     happy: 0.82,
//     sad: 0.5,
//     angry: 0.88,
//     surprised: 0.92,
//     thinking: 0.58,
//     shy: 0.52,
//   }[mood];
// }

// function normalizeReplySegments(
//   segments: any,
//   reply: string,
//   fallbackMood: Mood
// ): ReplySegment[] {
//   if (Array.isArray(segments)) {
//     const cleaned = segments
//       .map((seg) => ({
//         text: String(seg?.text || "").trim(),
//         mood: normalizeMoodValue(seg?.mood, fallbackMood),
//         holdMs:
//           typeof seg?.holdMs === "number" && Number.isFinite(seg.holdMs)
//             ? Math.max(500, Math.min(3000, Math.round(seg.holdMs)))
//             : undefined,
//       }))
//       .filter((seg) => seg.text);

//     if (cleaned.length) return cleaned;
//   }

//   return splitReplyIntoSegments(reply).map((text) => ({
//     text,
//     mood: fallbackMood,
//     holdMs: estimateSegmentHoldMs(text, fallbackMood),
//   }));
// }

// function fitModelToCanvas(model: any, app: any) {
//   const bounds = model?.getLocalBounds?.();

//   if (model?.anchor?.set) {
//     model.anchor.set(0.5, 0.5);
//   } else if (bounds && bounds.width && bounds.height) {
//     model.pivot.set(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
//   }

//   model.scale.set(MODEL_SCALE);
//   model.x = app.renderer.width * MODEL_X_RATIO;
//   model.y = app.renderer.height * MODEL_Y_RATIO;
// }



// export default function SiteAssistant() {
//   const location = useLocation();

//   const [open, setOpen] = useState(() => {
//     try {
//       return window.localStorage.getItem(STORAGE_OPEN_KEY) === "1";
//     } catch {
//       return false;
//     }
//   });

//   const [messages, setMessages] = useState<ChatMessage[]>(() => getInitialMessages());
//   const [input, setInput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [knowledge, setKnowledge] = useState<SiteKnowledge | null>(null);
//   const [displayMood, setDisplayMood] = useState<Mood>(
//     messages[messages.length - 1]?.mood || "neutral"
//   );
//   const [live2dReady, setLive2dReady] = useState(false);

//   const canvasRef = useRef<HTMLCanvasElement | null>(null);
//   const bubbleMessagesRef = useRef<HTMLDivElement | null>(null);
//   const pixiAppRef = useRef<any>(null);
//   const live2dModelRef = useRef<any>(null);

//   const pointerTargetRef = useRef({ x: 0, y: 0 });
//   const pointerCurrentRef = useRef({ x: 0, y: 0 });

//   const loadingRef = useRef(false);
//   const speakingUntilRef = useRef(0);
//   const moodRef = useRef<Mood>(displayMood);
//   const mouthStrengthRef = useRef(0.72);

//   const disabledReason = useMemo(() => {
//     if (!SITE_CHAT_ENDPOINT) return "未配置对话接口";
//     if (!knowledge) return "正在读取主页内容…";
//     return "";
//   }, [knowledge]);

//   const applyMoodToModel = useCallback((mood: Mood) => {
//     const model = live2dModelRef.current;
//     const coreModel = model?.internalModel?.coreModel;
//     if (!coreModel) return;

//     Object.values(EMOTION_TO_PARAM).forEach((paramId) => {
//       try {
//         coreModel.setParameterValueById(paramId, 0);
//       } catch {}
//     });

//     try {
//       coreModel.setParameterValueById(EMOTION_TO_PARAM[mood], 1);
//     } catch {}

//     try {
//       coreModel.setParameterValueById("ParamCheek", mood === "shy" ? 1 : 0.12);
//     } catch {}
//   }, []);

//   useEffect(() => {
//     moodRef.current = displayMood;
//     applyMoodToModel(displayMood);
//   }, [displayMood, applyMoodToModel]);

//   useEffect(() => {
//     try {
//       window.localStorage.setItem(STORAGE_MESSAGES_KEY, JSON.stringify(messages.slice(-24)));
//     } catch {}
//   }, [messages]);

//   useEffect(() => {
//     loadingRef.current = loading;
//   }, [loading]);

//   useEffect(() => {
//     try {
//       window.localStorage.setItem(STORAGE_OPEN_KEY, open ? "1" : "0");
//     } catch {}
//   }, [open]);

//   useEffect(() => {
//     if (!bubbleMessagesRef.current) return;
//     bubbleMessagesRef.current.scrollTop = bubbleMessagesRef.current.scrollHeight;
//   }, [messages, open, loading]);

//   useEffect(() => {
//     async function loadAllYaml() {
//       try {
//         const [profile, research, publications, education, work, teaching, service, news] =
//           await Promise.all([
//             loadYamlFile<any>("/data/profile.yaml"),
//             loadYamlFile<any>("/data/research.yaml"),
//             loadYamlFile<any>("/data/publications.yaml"),
//             loadYamlFile<any>("/data/education.yaml"),
//             loadYamlFile<any>("/data/work.yaml"),
//             loadYamlFile<any>("/data/teaching.yaml"),
//             loadYamlFile<any>("/data/service.yaml"),
//             loadYamlFile<any>("/data/news.yaml"),
//           ]);

//         setKnowledge(
//           compactSiteKnowledge({
//             profile,
//             research,
//             publications,
//             education,
//             work,
//             teaching,
//             service,
//             news,
//           })
//         );
//       } catch (e) {
//         console.error("Failed to load site data:", e);
//       }
//     }

//     loadAllYaml();
//   }, []);

//   useEffect(() => {
//     let disposed = false;
//     let fitTimers: number[] = [];
//     let handleResize: (() => void) | null = null;

//     async function initLive2d() {
//       if (!canvasRef.current) return;

//       try {
//         await loadAssistantScripts();
//         if (disposed || !window.PIXI?.live2d?.Live2DModel) return;

//         const PIXI = window.PIXI;

//         const app = new PIXI.Application({
//           view: canvasRef.current,
//           autoStart: true,
//           backgroundAlpha: 0,
//           antialias: true,
//           autoDensity: true,
//           resolution: Math.min(window.devicePixelRatio || 1, 2),
//           width: FIGURE_W,
//           height: FIGURE_H,
//         });

//         pixiAppRef.current = app;

//         const Live2DModel = PIXI.live2d.Live2DModel;
//         const model = await Live2DModel.from(MODEL_URL, {
//           autoInteract: false,
//         });

//         if (disposed) {
//           try {
//             app.destroy(true, { children: true, texture: false, baseTexture: false });
//           } catch {}
//           return;
//         }

//         live2dModelRef.current = model;
//         app.stage.addChild(model);

//         const refit = () => {
//           if (!disposed && live2dModelRef.current && pixiAppRef.current) {
//             fitModelToCanvas(live2dModelRef.current, pixiAppRef.current);
//           }
//         };

//         refit();

//         fitTimers = [
//           window.setTimeout(refit, 30),
//           window.setTimeout(refit, 120),
//           window.setTimeout(refit, 400),
//           window.setTimeout(refit, 900),
//         ];

//         setLive2dReady(true);
//         applyMoodToModel(moodRef.current);

//         app.ticker.add(() => {
//           const current = pointerCurrentRef.current;
//           const target = pointerTargetRef.current;

//           current.x += (target.x - current.x) * 0.12;
//           current.y += (target.y - current.y) * 0.12;
                  
//           const coreModel = live2dModelRef.current?.internalModel?.coreModel;
//           if (!coreModel) return;
                  
//           applyMoodToModel(moodRef.current);
                  
//           /**
//            * 这里把方向翻转：
//            * - 鼠标往右，角色也往右看：很多模型要写成 -current.x
//            * - 鼠标往上，角色往上看：很多模型要写成 -current.y
//            */
//           const lookX = -current.x;
//           const lookY = -current.y;
                  
//           /* 眼球更明显 */
//           try {
//             coreModel.setParameterValueById(
//               "ParamEyeBallX",
//               Math.max(-1, Math.min(1, lookX * 1.0))
//             );
//           } catch {}
          
//           try {
//             coreModel.setParameterValueById(
//               "ParamEyeBallY",
//               Math.max(-1, Math.min(1, lookY * 1.0))
//             );
//           } catch {}
          
//           /* 头部转动更明显 */
//           try {
//             coreModel.setParameterValueById(
//               "ParamAngleX",
//               Math.max(-30, Math.min(30, lookX * 26))
//             );
//           } catch {}
          
//           try {
//             coreModel.setParameterValueById(
//               "ParamAngleY",
//               Math.max(-22, Math.min(22, lookY * 18))
//             );
//           } catch {}
          
//           try {
//             coreModel.setParameterValueById(
//               "ParamAngleZ",
//               Math.max(-12, Math.min(12, lookX * 8))
//             );
//           } catch {}
          
//           try {
//             coreModel.setParameterValueById(
//               "ParamBodyAngleX",
//               Math.max(-14, Math.min(14, lookX * 10))
//             );
//           } catch {}


//           const speaking = loadingRef.current || speakingUntilRef.current > Date.now();
//           const t = performance.now() / 95;
//           const mouthStrength = mouthStrengthRef.current;

//           const mouthOpen = speaking
//             ? 0.10 + mouthStrength * (0.18 + 0.24 * (0.5 + 0.5 * Math.sin(t)))
//             : 0;

//           const mouthForm = speaking ? 0.18 : 0;

//           try {
//             coreModel.setParameterValueById("ParamMouthOpenY", mouthOpen);
//           } catch {}

//           try {
//             coreModel.setParameterValueById("ParamMouthForm", mouthForm);
//           } catch {}
//         });

//         handleResize = () => {
//           refit();
//         };

//         window.addEventListener("resize", handleResize);
//       } catch (e) {
//         console.error("Live2D init failed:", e);
//       }
//     }

//     initLive2d();

//     return () => {
//       disposed = true;

//       fitTimers.forEach((id) => window.clearTimeout(id));

//       if (handleResize) {
//         window.removeEventListener("resize", handleResize);
//       }

//       try {
//         pixiAppRef.current?.destroy?.(true, {
//           children: true,
//           texture: false,
//           baseTexture: false,
//         });
//       } catch {}

//       pixiAppRef.current = null;
//       live2dModelRef.current = null;
//     };
//   }, [applyMoodToModel]);

//   useEffect(() => {
//       const handleMouseMove = (event: MouseEvent) => {
//         const rawX = (event.clientX / window.innerWidth) * 2 - 1;
//         const rawY = (event.clientY / window.innerHeight) * 2 - 1;
    
//         // 放大一点鼠标输入，让跟随更明显
//         const boostedX = rawX * 1.25;
//         const boostedY = rawY * 1.25;
    
//         pointerTargetRef.current = {
//           x: Math.max(-1, Math.min(1, boostedX)),
//           y: Math.max(-1, Math.min(1, boostedY)),
//         };
//       };
  
//       const resetLook = () => {
//         pointerTargetRef.current = { x: 0, y: 0 };
//       };
  
//       window.addEventListener("mousemove", handleMouseMove);
//       window.addEventListener("mouseleave", resetLook);
  
//       return () => {
//         window.removeEventListener("mousemove", handleMouseMove);
//         window.removeEventListener("mouseleave", resetLook);
//       };
//     }, []);

//   function handleResetChat() {
//       const initial = getInitialMessages();

//     //   setMessages(initial);
//       setMessages([]);

//       setInput("");
//       setError("");
//       setLoading(false);
//     //   setDisplayMood(initial[initial.length - 1]?.mood || "neutral");
//       setDisplayMood("neutral");

//     //   moodRef.current = initial[initial.length - 1]?.mood || "neutral";
//       moodRef.current = "neutral";
//       speakingUntilRef.current = 0;
//       mouthStrengthRef.current = 0.72;

//       try {
//         window.localStorage.removeItem(STORAGE_MESSAGES_KEY);
//       } catch {}
//     }

//   async function sendMessage(rawText?: string) {
//     const question = (rawText ?? input).trim();
//     if (!question || loading || !knowledge) return;

//     const nextUserMessage: ChatMessage = { role: "user", content: question };
//     const nextMessages = [...messages, nextUserMessage];

//     setMessages(nextMessages);
//     setInput("");
//     setLoading(true);
//     setError("");
//     setOpen(true);
//     setDisplayMood("thinking");

//     mouthStrengthRef.current = 0.55;
//     speakingUntilRef.current = Date.now() + 1000;

//     try {
//       const response = await fetch(SITE_CHAT_ENDPOINT, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           currentPath: location.pathname,
//           siteData: knowledge,
//           history: nextMessages.slice(-10),
//           userMessage: question,
//         }),
//       });

//       const data = (await response.json()) as SiteChatResponse & { error?: string };

//       if (!response.ok) {
//         throw new Error(data.error || "对话失败");
//       }

//       const finalMood = data.mood || inferMoodFromText(data.reply);

//       const assistantMessage: ChatMessage = {
//         role: "assistant",
//         content: data.reply,
//         mood: finalMood,
//       };

//       setMessages((prev) => [...prev, assistantMessage]);
//       setDisplayMood(finalMood);

//       mouthStrengthRef.current = Math.max(0.3, Math.min(1, data.mouthStrength ?? 0.72));
//       speakingUntilRef.current =
//         Date.now() +
//         Math.min(
//           6500,
//           data.speakingMs ?? Math.max(1400, 900 + assistantMessage.content.length * 28)
//         );
//     } catch (e: any) {
//       console.error(e);
//       setError(e?.message || "Unknown error");
//       setMessages((prev) => prev.slice(0, -1));
//       setInput(question);
//       setDisplayMood("sad");
//       mouthStrengthRef.current = 0.45;
//       speakingUntilRef.current = Date.now() + 1200;
//     } finally {
//       setLoading(false);
//     }
//   }

//   return (
//     <div className={`site-assistant-root ${open ? "is-open" : ""}`}>
//       <div
//         className={`site-assistant-dialog-wrap ${open ? "is-visible" : ""}`}
//         style={{
//           left: `${DIALOG_LEFT}px`,
//           bottom: `${DIALOG_BOTTOM}px`,
//         }}
//       >
//         <div className="site-assistant-dialog">
//           <button
//             type="button"
//             className="site-assistant-close-bubble"
//             onClick={() => setOpen(false)}
//             aria-label="Close chat"
//           >
//             ×
//           </button>

//           <div className="site-assistant-dialog-quick">
//             {QUICK_PROMPTS.map((prompt) => (
//               <button
//                 key={prompt}
//                 type="button"
//                 className="site-assistant-quick-chip"
//                 onClick={() => sendMessage(prompt)}
//                 disabled={loading || !!disabledReason}
//               >
//                 {prompt}
//               </button>
//             ))}
//           </div>
        
//           <div className="site-assistant-dialog-messages" ref={bubbleMessagesRef}>
//             {messages.map((message, index) => (
//               <div
//                 key={`${message.role}-${index}`}
//                 className={`site-assistant-bubble-row ${message.role}`}
//               >
//                 <div className={`site-assistant-bubble ${message.role}`}>
//                   {message.content}
//                 </div>
//               </div>
//             ))}

//             {loading && (
//               <div className="site-assistant-bubble-row assistant">
//                 <div className="site-assistant-bubble assistant loading">
//                   <Spinner animation="border" size="sm" />
//                   <span>Thinking...</span>
//                 </div>
//               </div>
//             )}

//             {error && (
//               <div className="site-assistant-bubble-row assistant">
//                 <div className="site-assistant-bubble system error">{error}</div>
//               </div>
//             )}

//             {disabledReason && (
//               <div className="site-assistant-bubble-row assistant">
//                 <div className="site-assistant-bubble system note">{disabledReason}</div>
//               </div>
//             )}
//           </div>
        
//           <form
//             className="site-assistant-input-row"
//             onSubmit={(event) => {
//               event.preventDefault();
//               sendMessage();
//             }}
//           >
//             <textarea
//               className="site-assistant-input"
//               rows={2}
//               value={input}
//               onChange={(event) => setInput(event.target.value)}
//               placeholder="直接问我主页内容，或者自然聊天…"
//               disabled={loading || !!disabledReason}
//             />

//             <div className="site-assistant-input-actions">
//               <button
//                 type="submit"
//                 className="site-assistant-send"
//                 disabled={loading || !input.trim() || !!disabledReason}
//               >
//                 发送
//               </button>
        
//               <button
//                 type="button"
//                 className="site-assistant-reset"
//                 onClick={handleResetChat}
//                 disabled={loading}
//               >
//                 Reset
//               </button>
//             </div>
//           </form>
//         </div>

//       </div>


//       <div
//         className="site-assistant-figure-layer"
//         style={{
//           width: `${FIGURE_W}px`,
//           height: `${FIGURE_H}px`,
//         }}
//       >
//         <button
//           type="button"
//           className="site-assistant-figure"
//           onClick={() => setOpen(true)}
//           aria-label="Open AI chat"
//           style={{
//             width: `${FIGURE_W}px`,
//             height: `${FIGURE_H}px`,
//           }}
//         >
//           <canvas
//             ref={canvasRef}
//             className="site-assistant-canvas"
//             style={{
//               width: `${FIGURE_W}px`,
//               height: `${FIGURE_H}px`,
//             }}
//           />
//           {!live2dReady && <div className="site-assistant-fallback">AI</div>}
//         </button>

//         {!open && (
//           <button
//             type="button"
//             className="site-assistant-mini-bubble"
//             onClick={() => setOpen(true)}
//             style={{
//               left: `${MINI_BUBBLE_LEFT}px`,
//               bottom: `${MINI_BUBBLE_BOTTOM}px`,
//             }}
//           >
//             和我说话
//           </button>
//         )}
//       </div>
//     </div>
//   );
// }
