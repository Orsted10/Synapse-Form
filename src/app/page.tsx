"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import ParticleField from "@/components/ParticleField";
import LoadingSequence from "@/components/LoadingSequence";
import VideoBackground from "@/components/VideoBackground";
import ProgressBar from "@/components/ProgressBar";
import { submitFeedbackForm, type FeedbackFormData } from "@/lib/supabase";

const initialFormData: FeedbackFormData = {
  full_name: "",
  uid: "",
  branch: "",
  section: "",
  session_rating: 0,
  favorite_part: "",
  informative_rating: "",
  engaging_rating: 0,
  motivation_level: "",
  event_preferences: [],
  become_member: "",
  suggestions: "",
};

const terminalFiles = [
  "INIT_SEQUENCE.sys",
  "IDENTITY_MODULE.ts",
  "UID_VALIDATION.rs",
  "BRANCH_ALLOCATOR.cpp",
  "SECTION_MATRIX.py",
  "SESSION_RATING.go",
  "FAVORITE_MODULE.md",
  "INFORMATIVE_CHECK.sh",
  "ENGAGEMENT_LEVEL.txt",
  "MOTIVATION_INDEX.json",
  "EVENT_PREFERENCES.yaml",
  "MEMBERSHIP_STATUS.exe",
  "SUGGESTION_LOG.log",
];

// ── Scramble Text ─────────────────────────────────────
const scrambleChars = "!<>-_\\/[]{}—=+*^?#_";
function ScrambleText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState(text);
  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text.split("").map((letter, index) => {
          if (index < iteration) return letter;
          return scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
        }).join("")
      );
      if (iteration >= text.length) clearInterval(interval);
      iteration += 1 / 2;
    }, 28);
    return () => clearInterval(interval);
  }, [text]);
  return <span>{displayText}</span>;
}

// ── Glitch Text ───────────────────────────────────────
function GlitchText({ text }: { text: string }) {
  return (
    <span className="glitch-wrapper" data-text={text}>
      {text}
    </span>
  );
}

// ── Fancy Input ───────────────────────────────────────
function FancyInput({
  name, value, onChange, placeholder, error, autoFocus, type = "text"
}: {
  name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string; error?: string; autoFocus?: boolean; type?: string;
}) {
  const [focused, setFocused] = useState(false);
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Tiny haptic feedback on typing
    if (typeof window !== "undefined" && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(10); 
    }
  };

  return (
    <div className="fancy-input-wrapper">
      <div className={`fancy-input-container ${focused ? "focused" : ""} ${error ? "has-error" : ""}`}>
        <div className="fancy-input-corner tl" />
        <div className="fancy-input-corner tr" />
        <div className="fancy-input-corner bl" />
        <div className="fancy-input-corner br" />
        <span className="fancy-input-prefix">$</span>
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || "_"}
          autoFocus={autoFocus}
          autoComplete="off"
          className="fancy-input-field"
        />
        {focused && <span className="fancy-cursor" />}
      </div>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="fancy-error"
        >
          <span className="fancy-error-icon">⚠</span> {error}
        </motion.div>
      )}
    </div>
  );
}

// ── Fancy Textarea ────────────────────────────────────
function FancyTextarea({
  name, value, onChange, placeholder, autoFocus
}: {
  name: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string; autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className={`fancy-textarea-container ${focused ? "focused" : ""}`}>
      <div className="fancy-input-corner tl" />
      <div className="fancy-input-corner tr" />
      <div className="fancy-input-corner bl" />
      <div className="fancy-input-corner br" />
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder || "//  optional..."}
        autoFocus={autoFocus}
        rows={4}
        className="fancy-textarea-field"
      />
    </div>
  );
}

// ── Option Button ─────────────────────────────────────
function OptionBtn({
  label, selected, onClick, multi = false
}: {
  label: string; selected: boolean; onClick: () => void; multi?: boolean;
}) {
  return (
    <motion.button
      onClick={() => { playHaptic(); onClick(); }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`option-btn ${selected ? "option-btn-selected" : ""}`}
    >
      <span className={`option-check ${selected ? "checked" : ""}`}>
        {selected ? (multi ? "◆" : "●") : "○"}
      </span>
      <span className="option-label">{label}</span>
      {selected && <span className="option-glow-dot" />}
    </motion.button>
  );
}

// ── Rating Button ──────────────────────────────────────
function RatingBtn({ num, selected, onClick, label }: { num: number; selected: boolean; onClick: () => void; label?: string }) {
  return (
    <motion.button
      onClick={() => { playHaptic(); onClick(); }}
      whileHover={{ scale: 1.12, y: -3 }}
      whileTap={{ scale: 0.95 }}
      className={`rating-btn ${selected ? "rating-btn-selected" : ""}`}
    >
      <span className="rating-num">{num}</span>
      {label && <span className="rating-label">{label}</span>}
    </motion.button>
  );
}

// ── Nav Buttons ───────────────────────────────────────
function NavButtons({
  onBack, onNext, nextLabel, isSubmitting, canSkip, onSkip
}: {
  onBack: () => void; onNext: () => void; nextLabel?: string;
  isSubmitting?: boolean; canSkip?: boolean; onSkip?: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="nav-row"
    >
      <motion.button
        onClick={() => { playHaptic(); onBack(); }}
        whileHover={{ x: -3 }}
        whileTap={{ scale: 0.95 }}
        className="nav-back-btn"
      >
        <span className="nav-arrow">←</span>
        <span>BACK</span>
      </motion.button>

      <div className="nav-right">
        {canSkip && onSkip && (
          <motion.button
            onClick={() => { playHaptic(); onSkip(); }}
            whileHover={{ opacity: 0.8 }}
            className="nav-skip-btn"
          >
            skip
          </motion.button>
        )}
        <motion.button
          onClick={() => { playHapticHeavy(); onNext(); }}
          disabled={isSubmitting}
          whileHover={{ scale: 1.02, boxShadow: "0 0 30px rgba(168,85,247,0.6)" }}
          whileTap={{ scale: 0.97 }}
          className="nav-next-btn"
        >
          {isSubmitting ? (
            <span className="nav-loading">
              <span className="nav-dot" />
              <span className="nav-dot" />
              <span className="nav-dot" />
            </span>
          ) : (
            <>
              <span>{nextLabel || "CONTINUE"}</span>
              <span className="nav-arrow">→</span>
            </>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Question Header ────────────────────────────────────
function QuestionHeader({ step, file, question }: { step: number; file: string; question: string }) {
  return (
    <div className="q-header">
      <div className="q-file-badge">
        <span className="q-step-num">Q{step.toString().padStart(2, "0")}</span>
        <span className="q-sep">/</span>
        <span className="q-file">{file}</span>
      </div>
      <h2 className="q-question">
        <span className="q-prompt">&gt;</span> <ScrambleText text={question} />
      </h2>
    </div>
  );
}

// ── Animations ─────────────────────────────────────────
const pageVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 60 : -60, scale: 0.98 }),
  center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.45, ease: "easeOut" as const } },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -60 : 60, scale: 0.98, transition: { duration: 0.3 } }),
};

// ── Main Component ────────────────────────────────────
export default function FormSequence() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showLoading, setShowLoading] = useState(true);
  const [formData, setFormData] = useState<FeedbackFormData>(initialFormData);
  const [errors, setErrors] = useState<{ [k: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Enter key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isSubmitting && step > 0 && step < 13) {
        if (document.activeElement?.tagName === "TEXTAREA") return;
        e.preventDefault();
        playHapticHeavy();
        goNext();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [step, formData, isSubmitting]);

  const goNext = () => {
    if (validate()) {
      setDirection(1);
      if (step === 12) submitForm();
      else setStep(s => s + 1);
    }
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  const validate = (): boolean => {
    const e: { [k: string]: string } = {};
    if (step === 1 && !formData.full_name.trim()) e.full_name = "Full name required";
    if (step === 2) {
      if (!formData.uid.trim()) e.uid = "UID required";
      else if (!/^[A-Za-z0-9]+$/.test(formData.uid)) e.uid = "Invalid UID format";
    }
    if (step === 3 && !formData.branch.trim()) e.branch = "Branch required";
    if (step === 4 && !formData.section.trim()) e.section = "Section required";
    if (step === 5 && !formData.session_rating) e.session_rating = "Please select a rating";
    if (step === 6 && !formData.favorite_part) e.favorite_part = "Please select an option";
    if (step === 7 && !formData.informative_rating) e.informative_rating = "Please select an option";
    if (step === 8 && !formData.engaging_rating) e.engaging_rating = "Please select a rating";
    if (step === 9 && !formData.motivation_level) e.motivation_level = "Please select an option";
    if (step === 10 && !formData.event_preferences.length) e.event_preferences = "Select at least one";
    if (step === 11 && !formData.become_member) e.become_member = "Please select an option";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setErrors(prev => ({ ...prev, [name]: "" }));
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelect = (field: string, value: string | number) => {
    setErrors(prev => ({ ...prev, [field]: "" }));
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMulti = (field: keyof FeedbackFormData, item: string) => {
    setErrors(prev => ({ ...prev, [field]: "" }));
    setFormData(prev => {
      const arr = prev[field] as string[];
      return { ...prev, [field]: arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item] };
    });
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      const { success, error } = await submitFeedbackForm(formData);
      if (!success) throw new Error(error || "Submission failed");
      setDirection(1);
      setStep(13);
      const end = Date.now() + 3000;
      const frame = () => {
        confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#a855f7', '#06b6d4', '#22c55e'] });
        confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#a855f7', '#06b6d4', '#22c55e'] });
        if (Date.now() < end) requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    } catch (err: any) {
      alert(err.message || "Submission error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    const wrap = (key: string, content: React.ReactNode) => (
      <motion.div
        key={key}
        custom={direction}
        variants={pageVariants}
        initial="enter"
        animate="center"
        exit="exit"
        className="step-page"
      >
        {content}
      </motion.div>
    );

    switch (step) {
      case 0:
        return wrap("s0",
          <div className="welcome-page">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="welcome-logo"
            >
              SYNAPSE
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="welcome-divider-line"
            />
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="welcome-title"
            >
              <GlitchText text="ORIENTATION FEEDBACK" />
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="welcome-subtitle"
            >
              <ScrambleText text="Your feedback shapes our future. Takes less than 2 minutes." />
            </motion.p>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(168,85,247,0.7), 0 0 100px rgba(6,182,212,0.3)" }}
              whileTap={{ scale: 0.97 }}
              onClick={goNext}
              className="welcome-cta"
            >
              <span className="cta-bracket">[ </span>
              INITIALIZE FEEDBACK_MODULE
              <span className="cta-bracket"> ]</span>
              <span className="cta-arrow">→</span>
            </motion.button>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="welcome-hint"
            >
              Press Enter or click to begin
            </motion.div>
          </div>
        );

      case 1:
        return wrap("s1",
          <div className="q-page">
            <QuestionHeader step={1} file={terminalFiles[1]} question="What is your full name?" />
            <FancyInput name="full_name" value={formData.full_name} onChange={handleChange} placeholder="Full name..." error={errors.full_name} autoFocus />
            <NavButtons onBack={goBack} onNext={goNext} nextLabel="UID_VALIDATION.rs" />
          </div>
        );

      case 2:
        return wrap("s2",
          <div className="q-page">
            <QuestionHeader step={2} file={terminalFiles[2]} question="Your Chandigarh University UID" />
            <FancyInput name="uid" value={formData.uid} onChange={handleChange} placeholder="e.g. 24BCS1234" error={errors.uid} autoFocus />
            <NavButtons onBack={goBack} onNext={goNext} nextLabel="BRANCH_ALLOCATOR.cpp" />
          </div>
        );

      case 3:
        return wrap("s3",
          <div className="q-page">
            <QuestionHeader step={3} file={terminalFiles[3]} question="Your Branch / Department" />
            <FancyInput name="branch" value={formData.branch} onChange={handleChange} placeholder="e.g. B.E. CSE" error={errors.branch} autoFocus />
            <NavButtons onBack={goBack} onNext={goNext} nextLabel="SECTION_MATRIX.py" />
          </div>
        );

      case 4:
        return wrap("s4",
          <div className="q-page">
            <QuestionHeader step={4} file={terminalFiles[4]} question="Your Section" />
            <FancyInput name="section" value={formData.section} onChange={handleChange} placeholder="e.g. K23" error={errors.section} autoFocus />
            <NavButtons onBack={goBack} onNext={goNext} nextLabel="SESSION_RATING.go" />
          </div>
        );

      case 5:
        return wrap("s5",
          <div className="q-page">
            <QuestionHeader step={5} file={terminalFiles[5]} question="How would you rate today's orientation session?" />
            <div className="rating-row">
              {[1, 2, 3, 4, 5].map(n => (
                <RatingBtn
                  key={n}
                  num={n}
                  selected={formData.session_rating === n}
                  onClick={() => handleSelect("session_rating", n)}
                  label={n === 1 ? "Poor" : n === 5 ? "Excellent" : undefined}
                />
              ))}
            </div>
            {errors.session_rating && <div className="fancy-error"><span className="fancy-error-icon">⚠</span> {errors.session_rating}</div>}
            <NavButtons onBack={goBack} onNext={goNext} nextLabel="FAVORITE_MODULE.md" />
          </div>
        );

      case 6:
        return wrap("s6",
          <div className="q-page">
            <QuestionHeader step={6} file={terminalFiles[6]} question="Which part of the session did you enjoy the most?" />
            <div className="opts-grid">
              {["Club Introduction", "Interactive Activity", "Technical Demonstration", "Team Introduction", "Overall Experience"].map(opt => (
                <OptionBtn key={opt} label={opt} selected={formData.favorite_part === opt} onClick={() => handleSelect("favorite_part", opt)} />
              ))}
            </div>
            {errors.favorite_part && <div className="fancy-error"><span className="fancy-error-icon">⚠</span> {errors.favorite_part}</div>}
            <NavButtons onBack={goBack} onNext={goNext} nextLabel="INFORMATIVE_CHECK.sh" />
          </div>
        );

      case 7:
        return wrap("s7",
          <div className="q-page">
            <QuestionHeader step={7} file={terminalFiles[7]} question="Was the session informative and easy to understand?" />
            <div className="opts-grid opts-grid-2">
              {["Yes, definitely", "Mostly", "Somewhat", "No"].map(opt => (
                <OptionBtn key={opt} label={opt} selected={formData.informative_rating === opt} onClick={() => handleSelect("informative_rating", opt)} />
              ))}
            </div>
            {errors.informative_rating && <div className="fancy-error"><span className="fancy-error-icon">⚠</span> {errors.informative_rating}</div>}
            <NavButtons onBack={goBack} onNext={goNext} nextLabel="ENGAGEMENT_LEVEL.txt" />
          </div>
        );

      case 8:
        return wrap("s8",
          <div className="q-page">
            <QuestionHeader step={8} file={terminalFiles[8]} question="How engaging did you find the session?" />
            <div className="rating-row">
              {[1, 2, 3, 4, 5].map(n => (
                <RatingBtn key={n} num={n} selected={formData.engaging_rating === n} onClick={() => handleSelect("engaging_rating", n)} label={n === 1 ? "Boring" : n === 5 ? "Engaging" : undefined} />
              ))}
            </div>
            {errors.engaging_rating && <div className="fancy-error"><span className="fancy-error-icon">⚠</span> {errors.engaging_rating}</div>}
            <NavButtons onBack={goBack} onNext={goNext} nextLabel="MOTIVATION_INDEX.json" />
          </div>
        );

      case 9:
        return wrap("s9",
          <div className="q-page">
            <QuestionHeader step={9} file={terminalFiles[9]} question="Did the session motivate you to join future events?" />
            <div className="opts-grid opts-grid-3">
              {["Yes", "Maybe", "No"].map(opt => (
                <OptionBtn key={opt} label={opt} selected={formData.motivation_level === opt} onClick={() => handleSelect("motivation_level", opt)} />
              ))}
            </div>
            {errors.motivation_level && <div className="fancy-error"><span className="fancy-error-icon">⚠</span> {errors.motivation_level}</div>}
            <NavButtons onBack={goBack} onNext={goNext} nextLabel="EVENT_PREFERENCES.yaml" />
          </div>
        );

      case 10:
        const events = [
          "Coding Competitions", "AI & ML Workshops", "Web Development",
          "Cybersecurity", "Hackathons", "Technical Talks",
          "Resume & Interview Prep", "Google Technologies", "Fun Tech Games",
          "Networking Sessions", "Other"
        ];
        return wrap("s10",
          <div className="q-page">
            <QuestionHeader step={10} file={terminalFiles[10]} question="Which events would you like us to organize?" />
            <p className="q-hint">// Select all that apply</p>
            <div className="opts-grid opts-grid-multi">
              {events.map(opt => (
                <OptionBtn key={opt} label={opt} selected={formData.event_preferences.includes(opt)} onClick={() => handleMulti("event_preferences", opt)} multi />
              ))}
            </div>
            {errors.event_preferences && <div className="fancy-error"><span className="fancy-error-icon">⚠</span> {errors.event_preferences}</div>}
            <NavButtons onBack={goBack} onNext={goNext} nextLabel="MEMBERSHIP_STATUS.exe" />
          </div>
        );

      case 11:
        return wrap("s11",
          <div className="q-page">
            <QuestionHeader step={11} file={terminalFiles[11]} question="Would you like to become a Synapse Society member?" />
            <div className="opts-grid opts-grid-3">
              {["Yes", "Maybe", "No"].map(opt => (
                <OptionBtn key={opt} label={opt} selected={formData.become_member === opt} onClick={() => handleSelect("become_member", opt)} />
              ))}
            </div>
            {errors.become_member && <div className="fancy-error"><span className="fancy-error-icon">⚠</span> {errors.become_member}</div>}
            <NavButtons onBack={goBack} onNext={goNext} nextLabel="SUGGESTION_LOG.log" />
          </div>
        );

      case 12:
        return wrap("s12",
          <div className="q-page">
            <QuestionHeader step={12} file={terminalFiles[12]} question="Any suggestions or feedback for us?" />
            <p className="q-hint">// This field is optional</p>
            <FancyTextarea name="suggestions" value={formData.suggestions} onChange={handleChange} placeholder="// Type your feedback here..." autoFocus />
            <NavButtons onBack={goBack} onNext={goNext} nextLabel="./submit.sh" isSubmitting={isSubmitting} canSkip onSkip={() => { setErrors({}); goNext(); }} />
          </div>
        );

      case 13:
        return wrap("s13",
          <motion.div className="success-page">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="success-check"
            >
              ✓
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="success-title">
              <GlitchText text="FEEDBACK_REGISTERED" />
            </motion.h2>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="success-log">
              <div><span className="log-key">STATUS</span><span className="log-sep">:</span><span className="log-ok">200 OK</span></div>
              <div><span className="log-key">DB_SYNC</span><span className="log-sep">:</span><span className="log-ok">COMPLETE</span></div>
              <div><span className="log-key">MSG</span><span className="log-sep">:</span><span className="log-val">Thank you for attending our orientation!</span></div>
            </motion.div>
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.04 }}
              onClick={() => window.location.reload()}
              className="success-reload"
            >
              reboot_system.sh
            </motion.button>
          </motion.div>
        );
    }
  };

  return (
    <>
      <VideoBackground />
      <ParticleField />
      
      {/* Immersive CRT Overlays */}
      <div className="vignette-overlay pointer-events-none" />
      <div className="scanlines-overlay pointer-events-none" />

      <AnimatePresence>
        {showLoading && (
          <LoadingSequence key="loading" onComplete={() => setShowLoading(false)} />
        )}
      </AnimatePresence>

      {!showLoading && step > 0 && step < 13 && (
        <>
          <ProgressBar current={step} total={12} />
          <div className="step-counter-badge">
            <span className="scb-step">{step.toString().padStart(2, "0")}</span>
            <span className="scb-sep"> / </span>
            <span className="scb-total">12</span>
          </div>
        </>
      )}

      <main className="main-container">
        <div className="form-shell">
          <AnimatePresence mode="wait" custom={direction}>
            {renderStep()}
          </AnimatePresence>
        </div>
      </main>
    </>
  );
}
