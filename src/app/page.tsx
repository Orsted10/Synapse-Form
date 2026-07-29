"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import ParticleField from "@/components/ParticleField";
import LoadingSequence from "@/components/LoadingSequence";
import VideoBackground from "@/components/VideoBackground";
import ProgressBar from "@/components/ProgressBar";
import { submitFeedbackForm, type FeedbackFormData } from "@/lib/supabase";

// ── State Initialization ───────────────────────────────
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

// Map questions to terminal file names
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
  "SUGGESTION_LOG.log"
];

// ── Scramble Text Hook ─────────────────────────────────
const chars = "!<>-_\\\\/[]{}—=+*^?#________";
function ScrambleText({ text }: { text: string }) {
  const [displayText, setDisplayText] = useState("");
  const [isScrambling, setIsScrambling] = useState(true);

  useEffect(() => {
    let iteration = 0;
    setIsScrambling(true);
    
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((letter, index) => {
            if (index < iteration) {
              return letter;
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
        setIsScrambling(false);
      }
      iteration += 1 / 2;
    }, 30);

    return () => clearInterval(interval);
  }, [text]);

  return <span>{displayText}</span>;
}

function GlitchText({ text, active }: { text: string; active?: boolean }) {
  if (!active) return <span>{text}</span>;
  return (
    <span className="glitch-text" data-text={text}>
      {text}
    </span>
  );
}

// ── Main Component ────────────────────────────────────
export default function FormSequence() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showLoading, setShowLoading] = useState(true);
  const [formData, setFormData] = useState<FeedbackFormData>(initialFormData);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isSubmitting && step > 0 && step < 13) {
        e.preventDefault();
        
        // Disable Enter key for textareas
        if (document.activeElement?.tagName === "TEXTAREA") return;
        
        goNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [step, formData, isSubmitting]);

  // ── Navigation ──────────────────────────────────────
  const goNext = () => {
    if (validateStep()) {
      setDirection(1);
      if (step === 12) {
        submitForm();
      } else {
        setStep((s) => s + 1);
      }
    }
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => s - 1);
  };

  // ── Validation ──────────────────────────────────────
  const validateStep = () => {
    const newErrors: { [key: string]: string } = {};

    switch (step) {
      case 1:
        if (!formData.full_name.trim()) newErrors.full_name = "ERROR: NAME REQUIRED.";
        break;
      case 2:
        if (!formData.uid.trim()) {
          newErrors.uid = "ERROR: UID REQUIRED.";
        } else if (!/^[A-Za-z0-9]+$/.test(formData.uid)) {
          newErrors.uid = "ERROR: INVALID UID FORMAT.";
        }
        break;
      case 3:
        if (!formData.branch.trim()) newErrors.branch = "ERROR: BRANCH REQUIRED.";
        break;
      case 4:
        if (!formData.section.trim()) newErrors.section = "ERROR: SECTION REQUIRED.";
        break;
      case 5:
        if (formData.session_rating === 0) newErrors.session_rating = "ERROR: RATING REQUIRED.";
        break;
      case 6:
        if (!formData.favorite_part) newErrors.favorite_part = "ERROR: SELECTION REQUIRED.";
        break;
      case 7:
        if (!formData.informative_rating) newErrors.informative_rating = "ERROR: SELECTION REQUIRED.";
        break;
      case 8:
        if (formData.engaging_rating === 0) newErrors.engaging_rating = "ERROR: RATING REQUIRED.";
        break;
      case 9:
        if (!formData.motivation_level) newErrors.motivation_level = "ERROR: SELECTION REQUIRED.";
        break;
      case 10:
        if (formData.event_preferences.length === 0) newErrors.event_preferences = "ERROR: SELECT AT LEAST ONE.";
        break;
      case 11:
        if (!formData.become_member) newErrors.become_member = "ERROR: SELECTION REQUIRED.";
        break;
      case 12:
        // Suggestions optional
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Input Handlers ──────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelect = (field: string, value: string | number) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleMultiSelect = (field: keyof FeedbackFormData, item: string) => {
    setFormData((prev) => {
      const array = prev[field] as string[];
      const newArray = array.includes(item)
        ? array.filter((i) => i !== item)
        : [...array, item];
      
      if (errors[field]) setErrors((prevErrs) => ({ ...prevErrs, [field]: "" }));
      return { ...prev, [field]: newArray };
    });
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      const { success, error } = await submitFeedbackForm(formData);
      if (!success) throw new Error(error || "Submission failed");
      
      // Success!
      setDirection(1);
      setStep(13); // Final success screen
      
      // Fire confetti
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ['#7c3aed', '#06b6d4', '#22c55e']
        });
        confetti({
          ...defaults, particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ['#7c3aed', '#06b6d4', '#22c55e']
        });
      }, 250);

    } catch (err: any) {
      console.error("Submission failed:", err);
      alert(err.message || "System failure during database sync. Check console.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Render Helpers ──────────────────────────────────
  const renderNav = (canSkip = false) => (
    <motion.div variants={childVariants} className="nav-buttons">
      <button onClick={goBack} className="nav-button back">
        <span className="arrow-icon">←</span> cd ..
      </button>
      
      <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
        {canSkip && (
          <button onClick={() => { setErrors({}); goNext(); }} className="nav-button skip">
            skip --force
          </button>
        )}
        <button onClick={goNext} disabled={isSubmitting} className="nav-button next">
          {step === 12 ? (isSubmitting ? "UPLOADING..." : "./submit.sh") : "cd ./" + terminalFiles[step + 1]} <span className="arrow-icon">→</span>
        </button>
      </div>
    </motion.div>
  );

  const containerVariants = {
    hidden: { opacity: 0, x: direction > 0 ? 50 : -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, staggerChildren: 0.1 } },
    exit: { opacity: 0, x: direction > 0 ? -50 : 50, transition: { duration: 0.3 } },
  };

  const childVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  // ── Render Form Steps ───────────────────────────────
  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <motion.div
            key="step0"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="terminal-content welcome-module"
          >
            <motion.pre variants={childVariants} className="ascii-art" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.2, textAlign: "center" }}>
              {"   _____ __  __ _   _          _____  _____  ______ \n  / ____|  \\/  | \\ | |        / ____|/ ____||  ____|\n | (___ | \\  / |  \\| | ______| (___ | (___  | |__   \n  \\___ \\| |\\/| | . ` |______\\___ \\ \\___ \\ |  __|  \n  ____) | |  | | |\\  |        ____) |____) || |____ \n |_____/|_|  |_|_| \\_|       |_____/|_____/ |______|\n"}
            </motion.pre>
            <motion.h1 variants={childVariants} className="terminal-title">
              <GlitchText text="ORIENTATION FEEDBACK" active={true} />
            </motion.h1>
            <motion.p variants={childVariants} className="terminal-subtitle">
              <ScrambleText text="Your feedback is valuable to us and will help us improve future sessions and events. Time required: < 2 mins." />
            </motion.p>
            <motion.div variants={childVariants}>
              <button onClick={goNext} className="action-button primary glow">
                [ INITIALIZE FEEDBACK_MODULE ]
              </button>
            </motion.div>
          </motion.div>
        );

      case 1:
        return (
          <motion.div key="step1" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="terminal-content">
            <motion.h2 variants={childVariants} className="step-title">
              <span className="prompt-symbol">&gt;</span> Enter Full Name
            </motion.h2>
            <motion.div variants={childVariants} className="input-group">
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`cli-input ${errors.full_name ? 'error' : ''}`}
                placeholder="_"
                autoFocus
                autoComplete="off"
              />
              {errors.full_name && <div className="error-text">{errors.full_name}</div>}
            </motion.div>
            {renderNav()}
          </motion.div>
        );

      case 2:
        return (
          <motion.div key="step2" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="terminal-content">
            <motion.h2 variants={childVariants} className="step-title">
              <span className="prompt-symbol">&gt;</span> Chandigarh University UID
            </motion.h2>
            <motion.div variants={childVariants} className="input-group">
              <input
                type="text"
                name="uid"
                value={formData.uid}
                onChange={handleChange}
                className={`cli-input ${errors.uid ? 'error' : ''}`}
                placeholder="e.g. 21BCSXXXX"
                autoFocus
                autoComplete="off"
              />
              {errors.uid && <div className="error-text">{errors.uid}</div>}
            </motion.div>
            {renderNav()}
          </motion.div>
        );

      case 3:
        return (
          <motion.div key="step3" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="terminal-content">
            <motion.h2 variants={childVariants} className="step-title">
              <span className="prompt-symbol">&gt;</span> Branch / Department
            </motion.h2>
            <motion.div variants={childVariants} className="input-group">
              <input
                type="text"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                className={`cli-input ${errors.branch ? 'error' : ''}`}
                placeholder="e.g. B.E. CSE"
                autoFocus
              />
              {errors.branch && <div className="error-text">{errors.branch}</div>}
            </motion.div>
            {renderNav()}
          </motion.div>
        );

      case 4:
        return (
          <motion.div key="step4" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="terminal-content">
            <motion.h2 variants={childVariants} className="step-title">
              <span className="prompt-symbol">&gt;</span> Section
            </motion.h2>
            <motion.div variants={childVariants} className="input-group">
              <input
                type="text"
                name="section"
                value={formData.section}
                onChange={handleChange}
                className={`cli-input ${errors.section ? 'error' : ''}`}
                placeholder="_"
                autoFocus
              />
              {errors.section && <div className="error-text">{errors.section}</div>}
            </motion.div>
            {renderNav()}
          </motion.div>
        );

      case 5:
        return (
          <motion.div key="step5" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="terminal-content">
            <motion.h2 variants={childVariants} className="step-title">
              <span className="prompt-symbol">&gt;</span> How would you rate today's orientation session?
            </motion.h2>
            <motion.div variants={childVariants} className="rating-group">
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '20px' }}>
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    onClick={() => handleSelect("session_rating", num)}
                    className={`rating-button ${formData.session_rating === num ? 'selected' : ''}`}
                  >
                    [{num}]
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0 10px' }}>
                <span>1 - Poor</span>
                <span>5 - Excellent</span>
              </div>
              {errors.session_rating && <div className="error-text" style={{textAlign: 'center', marginTop: '10px'}}>{errors.session_rating}</div>}
            </motion.div>
            {renderNav()}
          </motion.div>
        );

      case 6:
        return (
          <motion.div key="step6" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="terminal-content">
            <motion.h2 variants={childVariants} className="step-title">
              <span className="prompt-symbol">&gt;</span> Which part of the session did you enjoy the most?
            </motion.h2>
            <motion.div variants={childVariants} className="options-grid">
              {[
                "Club Introduction", 
                "Interactive Activity", 
                "Technical Demonstration", 
                "Team Introduction", 
                "Overall Experience"
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => handleSelect("favorite_part", opt)}
                  className={`option-button ${formData.favorite_part === opt ? 'selected' : ''}`}
                >
                  <span className="bracket">[</span>
                  {formData.favorite_part === opt ? "x" : " "}
                  <span className="bracket">]</span> {opt}
                </button>
              ))}
              {errors.favorite_part && <div className="error-text">{errors.favorite_part}</div>}
            </motion.div>
            {renderNav()}
          </motion.div>
        );

      case 7:
        return (
          <motion.div key="step7" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="terminal-content">
            <motion.h2 variants={childVariants} className="step-title">
              <span className="prompt-symbol">&gt;</span> Was the session informative and easy to understand?
            </motion.h2>
            <motion.div variants={childVariants} className="options-grid">
              {[
                "Yes, definitely", 
                "Mostly", 
                "Somewhat", 
                "No"
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => handleSelect("informative_rating", opt)}
                  className={`option-button ${formData.informative_rating === opt ? 'selected' : ''}`}
                >
                  <span className="bracket">[</span>
                  {formData.informative_rating === opt ? "x" : " "}
                  <span className="bracket">]</span> {opt}
                </button>
              ))}
              {errors.informative_rating && <div className="error-text">{errors.informative_rating}</div>}
            </motion.div>
            {renderNav()}
          </motion.div>
        );

      case 8:
        return (
          <motion.div key="step8" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="terminal-content">
            <motion.h2 variants={childVariants} className="step-title">
              <span className="prompt-symbol">&gt;</span> How engaging did you find the session?
            </motion.h2>
            <motion.div variants={childVariants} className="rating-group">
              <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', marginBottom: '20px' }}>
                {[1, 2, 3, 4, 5].map(num => (
                  <button
                    key={num}
                    onClick={() => handleSelect("engaging_rating", num)}
                    className={`rating-button ${formData.engaging_rating === num ? 'selected' : ''}`}
                  >
                    [{num}]
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8rem', padding: '0 10px' }}>
                <span>1 - Not engaging</span>
                <span>5 - Very engaging</span>
              </div>
              {errors.engaging_rating && <div className="error-text" style={{textAlign: 'center', marginTop: '10px'}}>{errors.engaging_rating}</div>}
            </motion.div>
            {renderNav()}
          </motion.div>
        );

      case 9:
        return (
          <motion.div key="step9" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="terminal-content">
            <motion.h2 variants={childVariants} className="step-title">
              <span className="prompt-symbol">&gt;</span> Did the session motivate you to participate in future Synapse Society events?
            </motion.h2>
            <motion.div variants={childVariants} className="options-grid">
              {[
                "Yes", 
                "Maybe", 
                "No"
              ].map(opt => (
                <button
                  key={opt}
                  onClick={() => handleSelect("motivation_level", opt)}
                  className={`option-button ${formData.motivation_level === opt ? 'selected' : ''}`}
                >
                  <span className="bracket">[</span>
                  {formData.motivation_level === opt ? "x" : " "}
                  <span className="bracket">]</span> {opt}
                </button>
              ))}
              {errors.motivation_level && <div className="error-text">{errors.motivation_level}</div>}
            </motion.div>
            {renderNav()}
          </motion.div>
        );

      case 10:
        const eventOptions = [
          "Coding Competitions", "AI & Machine Learning Workshops", 
          "Web Development", "Cybersecurity", "Hackathons", 
          "Technical Talks", "Resume & Interview Preparation", 
          "Google Technologies", "Fun Tech Games", 
          "Networking Sessions", "Other"
        ];
        return (
          <motion.div key="step10" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="terminal-content">
            <motion.h2 variants={childVariants} className="step-title">
              <span className="prompt-symbol">&gt;</span> Which types of events would you like Synapse Society to organize? (Select all that apply)
            </motion.h2>
            <motion.div variants={childVariants} className="options-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
              {eventOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleMultiSelect("event_preferences", opt)}
                  className={`option-button multi ${formData.event_preferences.includes(opt) ? 'selected' : ''}`}
                >
                  <span className="bracket">[</span>
                  {formData.event_preferences.includes(opt) ? "*" : " "}
                  <span className="bracket">]</span> {opt}
                </button>
              ))}
              {errors.event_preferences && <div className="error-text" style={{ gridColumn: '1 / -1' }}>{errors.event_preferences}</div>}
            </motion.div>
            {renderNav()}
          </motion.div>
        );

      case 11:
        return (
          <motion.div key="step11" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="terminal-content">
            <motion.h2 variants={childVariants} className="step-title">
              <span className="prompt-symbol">&gt;</span> Would you like to become a member of Synapse Society?
            </motion.h2>
            <motion.div variants={childVariants} className="options-grid">
              {["Yes", "Maybe", "No"].map(opt => (
                <button
                  key={opt}
                  onClick={() => handleSelect("become_member", opt)}
                  className={`option-button ${formData.become_member === opt ? 'selected' : ''}`}
                >
                  <span className="bracket">[</span>
                  {formData.become_member === opt ? "x" : " "}
                  <span className="bracket">]</span> {opt}
                </button>
              ))}
              {errors.become_member && <div className="error-text">{errors.become_member}</div>}
            </motion.div>
            {renderNav()}
          </motion.div>
        );

      case 12:
        return (
          <motion.div key="step12" variants={containerVariants} initial="hidden" animate="visible" exit="exit" className="terminal-content">
            <motion.h2 variants={childVariants} className="step-title">
              <span className="prompt-symbol">&gt;</span> Any suggestions or feedback for us? (Optional)
            </motion.h2>
            <motion.div variants={childVariants} className="input-group">
              <textarea
                name="suggestions"
                value={formData.suggestions}
                onChange={handleChange}
                className="cli-textarea"
                placeholder="Type your feedback here..."
                rows={5}
                autoFocus
              />
            </motion.div>
            {renderNav(true)}
          </motion.div>
        );

      case 13:
        return (
          <motion.div
            key="step13"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="terminal-content success-module"
          >
            <motion.div variants={childVariants} className="success-icon" style={{ fontSize: '4rem', marginBottom: '20px', color: 'var(--accent-primary)' }}>
              ✓
            </motion.div>
            <motion.h2 variants={childVariants} className="terminal-title">
              <GlitchText text="FEEDBACK_REGISTERED" active={true} />
            </motion.h2>
            <motion.div variants={childVariants} className="terminal-text" style={{ marginTop: '20px', color: 'var(--text-secondary)' }}>
              <p>STATUS: <span style={{ color: 'var(--accent-primary)' }}>OK</span></p>
              <p>SYNC: <span style={{ color: 'var(--accent-primary)' }}>COMPLETE</span></p>
              <p style={{ marginTop: '20px' }}>Thank you for attending the Synapse Society Orientation Session.</p>
              <p>Your data has been securely logged in the system.</p>
            </motion.div>
            <motion.div variants={childVariants} style={{ marginTop: '40px' }}>
              <button onClick={() => window.location.reload()} className="nav-button">
                reboot_system.sh
              </button>
            </motion.div>
          </motion.div>
        );
    }
  };

  return (
    <>
      <VideoBackground />
      <ParticleField />
      
      <AnimatePresence>
        {showLoading && (
          <LoadingSequence key="loading" onComplete={() => setShowLoading(false)} />
        )}
      </AnimatePresence>

      <ProgressBar current={step} total={12} />

      <main className="main-container">
        <div className="terminal-container">
          <div className="terminal-header">
            <div className="terminal-dots">
              <span className="dot dot-red"></span>
              <span className="dot dot-yellow"></span>
              <span className="dot dot-green"></span>
            </div>
            <span className="terminal-title">{terminalFiles[Math.min(step, 12)]}</span>
          </div>

          <div className="terminal-body">
            <AnimatePresence mode="wait" custom={direction}>
              {renderStep()}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </>
  );
}
