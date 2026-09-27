import { useEffect, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { IoFitnessOutline } from "react-icons/io5";
import {
  HiOutlineChartBar,
  HiOutlineBolt,
  HiOutlineHeart,
  HiOutlineUserGroup,
  HiOutlineClipboardDocumentList,
  HiOutlineCalendarDays,
  HiOutlineCreditCard,
  HiOutlineAcademicCap,
  HiOutlineArrowRight,
  HiOutlineCheck,
  HiChevronDown,
  HiOutlineCheckCircle,
  HiXMark,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { enrollInPlan, getMyMembership } from "../services/membershipService";
import { getActiveDiscounts } from "../services/discountService";
import { getErrorMessage } from "../utils/formatters";
import ThemeToggle from "../components/ui/ThemeToggle";
import "../styles/landing.css";

/* ── Reusable animated counter ─────────────────────────── */
function useCountUp(target, duration = 1400) {
  const [value, setValue] = useState(0);
  const ref = useRef(null);
  const counted = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !counted.current) {
          counted.current = true;
          let start = null;
          const tick = (ts) => {
            if (!start) start = ts;
            const p = Math.min((ts - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(Math.round(target * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  return { ref, value };
}

/* ── Reveal-on-scroll hook ─────────────────────────────── */
function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("revealed");
          io.unobserve(el);
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return ref;
}

/* ── FAQ Accordion Item ────────────────────────────────── */
const FaqItem = ({ num, question, answer }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`lp-faq-item ${open ? "open" : ""}`}>
      <button
        className="lp-faq-summary"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="lp-faq-num">{num}</span>
        <span className="lp-faq-question">{question}</span>
        <HiChevronDown className="lp-faq-chev" />
      </button>
      <div className="lp-faq-answer">
        <p>{answer}</p>
      </div>
    </div>
  );
};

/* ── Stat Counter ──────────────────────────────────────── */
const StatCounter = ({ target, suffix = "", label }) => {
  const { ref, value } = useCountUp(target);
  return (
    <div className="lp-stat" ref={ref}>
      <b className="lp-stat-value">
        {target >= 1000
          ? value >= 1000
            ? `${Math.round(value / 1000)}K`
            : value
          : value}
        {suffix}
      </b>
      <span className="lp-stat-label">{label}</span>
    </div>
  );
};

/* ── Landing Page Component ────────────────────────────── */
const LandingPage = () => {
  const revealTransform = useReveal();
  const revealFeatures = useReveal();
  const revealPlans = useReveal();
  const revealTestimonials = useReveal();
  const revealFaq = useReveal();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isAuthenticated, loading: authLoading, user, logout } = useAuth();

  const [enrolling, setEnrolling] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [enrolledPlan, setEnrolledPlan] = useState(null);
  const [activeMembership, setActiveMembership] = useState(null);
  const [planDiscountMap, setPlanDiscountMap] = useState({});
  const autoEnrollAttempted = useRef(false);

  // ── Fitness Questionnaire Modal State ──────────────
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState(null);
  const [questionStep, setQuestionStep] = useState(0);
  const [fitnessAnswers, setFitnessAnswers] = useState({
    fitnessGoal: "",
    fitnessLevel: "",
    bodyFocus: "",
    dietPreference: "",
  });

  const questionnaireSteps = [
    {
      key: "fitnessGoal",
      question: "What's your primary fitness goal?",
      icon: "🎯",
      options: [
        { value: "weight_loss", label: "Weight Loss", emoji: "🔥", desc: "Shed fat and get lean" },
        { value: "muscle_gain", label: "Muscle Gain", emoji: "💪", desc: "Build size and mass" },
        { value: "strength_training", label: "Strength Training", emoji: "🏋️", desc: "Get stronger overall" },
        { value: "general_fitness", label: "General Fitness", emoji: "🏃", desc: "Stay fit and healthy" },
        { value: "endurance", label: "Endurance", emoji: "⚡", desc: "Build stamina and cardio" },
      ],
    },
    {
      key: "fitnessLevel",
      question: "What's your current fitness level?",
      icon: "📊",
      options: [
        { value: "beginner", label: "Beginner", emoji: "🌱", desc: "New to working out" },
        { value: "intermediate", label: "Intermediate", emoji: "🌿", desc: "Some experience" },
        { value: "advanced", label: "Advanced", emoji: "🌳", desc: "Seasoned athlete" },
      ],
    },
    {
      key: "bodyFocus",
      question: "Which area do you want to focus on?",
      icon: "🎯",
      options: [
        { value: "full_body", label: "Full Body", emoji: "🧍", desc: "Balanced all-round training" },
        { value: "upper_body", label: "Upper Body", emoji: "💪", desc: "Chest, shoulders, arms, back" },
        { value: "lower_body", label: "Lower Body", emoji: "🦵", desc: "Legs, glutes, calves" },
        { value: "core", label: "Core & Abs", emoji: "🧘", desc: "Abs, obliques, stability" },
        { value: "cardio", label: "Cardio Focus", emoji: "❤️", desc: "Heart health and fat burn" },
      ],
    },
    {
      key: "dietPreference",
      question: "What's your diet preference?",
      icon: "🍽️",
      options: [
        { value: "vegetarian", label: "Vegetarian", emoji: "🥗", desc: "No meat or fish" },
        { value: "non_vegetarian", label: "Non-Vegetarian", emoji: "🍗", desc: "Includes all foods" },
        { value: "vegan", label: "Vegan", emoji: "🌱", desc: "No animal products" },
        { value: "eggetarian", label: "Eggetarian", emoji: "🥚", desc: "Vegetarian + eggs" },
      ],
    },
  ];

  // ── Fetch active discounts on mount ───────────────────
  useEffect(() => {
    getActiveDiscounts()
      .then((res) => {
        const data = res.data?.data ?? res.data;
        if (data?.planDiscountMap) {
          setPlanDiscountMap(data.planDiscountMap);
        }
      })
      .catch((err) => {
        console.warn("Could not load active discounts:", err);
      });
  }, []);

  // ── Check existing membership on mount ──────────────
  useEffect(() => {
    const token = localStorage.getItem("fittrack_token");
    if (isAuthenticated && token && !authLoading) {
      getMyMembership()
        .then((res) => {
          const membership = res.data?.data ?? res.data;
          if (membership) setActiveMembership(membership);
        })
        .catch(() => {});
    }
  }, [isAuthenticated, authLoading]);

  // ── Auto-enroll from URL param or session (after login redirect) ──
  useEffect(() => {
    const pendingPlan = searchParams.get("plan") || sessionStorage.getItem("fittrack_pending_plan");
    const token = localStorage.getItem("fittrack_token");

    if (
      pendingPlan &&
      isAuthenticated &&
      token &&
      token !== "null" &&
      token !== "undefined" &&
      !authLoading &&
      !autoEnrollAttempted.current &&
      !activeMembership
    ) {
      autoEnrollAttempted.current = true;
      let preserved = null;
      try {
        const raw = sessionStorage.getItem("fittrack_pending_answers");
        if (raw) preserved = JSON.parse(raw);
      } catch {}

      setSelectedPlanName(pendingPlan);

      if (preserved && preserved.fitnessGoal && preserved.dietPreference) {
        sessionStorage.removeItem("fittrack_pending_plan");
        sessionStorage.removeItem("fittrack_pending_answers");
        setFitnessAnswers(preserved);
        handleEnroll(pendingPlan, preserved);
      } else {
        setQuestionStep(0);
        setFitnessAnswers({ fitnessGoal: "", fitnessLevel: "", bodyFocus: "", dietPreference: "" });
        setShowQuestionnaire(true);
      }

      if (searchParams.get("plan")) {
        searchParams.delete("plan");
        setSearchParams(searchParams, { replace: true });
      }
    }
  }, [isAuthenticated, authLoading, searchParams, activeMembership]);

  // ── Enrollment handler ─────────────────────────────
  const handleChoosePlan = useCallback(
    (planName) => {
      const token = localStorage.getItem("fittrack_token");
      const hasValidToken = token && token !== "null" && token !== "undefined" && token.trim() !== "";

      if (!isAuthenticated || !hasValidToken) {
        // Save plan context for seamless resumption after login
        sessionStorage.setItem("fittrack_pending_plan", planName);
        toast("Please sign in or create an account to choose your plan.", { icon: "🔒" });
        navigate(`/login?plan=${encodeURIComponent(planName)}`);
        return;
      }

      if (activeMembership) {
        toast.error("You already have an active membership!");
        return;
      }

      // Open the fitness questionnaire
      setSelectedPlanName(planName);
      setQuestionStep(0);
      setFitnessAnswers({ fitnessGoal: "", fitnessLevel: "", bodyFocus: "", dietPreference: "" });
      setShowQuestionnaire(true);
    },
    [isAuthenticated, activeMembership, navigate]
  );

  const handleQuestionSelect = (key, value) => {
    setFitnessAnswers((prev) => ({ ...prev, [key]: value }));
    // Auto-advance to next step after a short delay
    setTimeout(() => {
      if (questionStep < questionnaireSteps.length - 1) {
        setQuestionStep((s) => s + 1);
      }
    }, 350);
  };

  const handleQuestionnaireSubmit = () => {
    const token = localStorage.getItem("fittrack_token");
    const hasValidToken = token && token !== "null" && token !== "undefined" && token.trim() !== "";

    if (!hasValidToken) {
      sessionStorage.setItem("fittrack_pending_plan", selectedPlanName);
      sessionStorage.setItem("fittrack_pending_answers", JSON.stringify(fitnessAnswers));
      toast.error("Session expired or token missing. Please sign in to complete enrollment.");
      setShowQuestionnaire(false);
      navigate(`/login?plan=${encodeURIComponent(selectedPlanName)}`);
      return;
    }

    setShowQuestionnaire(false);
    handleEnroll(selectedPlanName, fitnessAnswers);
  };

  const handleEnroll = async (planName, fitnessData = {}) => {
    const token = localStorage.getItem("fittrack_token");
    const hasValidToken = token && token !== "null" && token !== "undefined" && token.trim() !== "";

    if (!hasValidToken) {
      sessionStorage.setItem("fittrack_pending_plan", planName);
      sessionStorage.setItem("fittrack_pending_answers", JSON.stringify(fitnessData));
      toast.error("Authentication required. Please sign in to enroll.");
      navigate(`/login?plan=${encodeURIComponent(planName)}`);
      return;
    }

    setEnrolling(true);
    try {
      const res = await enrollInPlan({ planName, ...fitnessData });
      const membership = res.data?.data ?? res.data;
      setEnrolledPlan(membership);
      setActiveMembership(membership);
      setShowSuccessModal(true);
      sessionStorage.removeItem("fittrack_pending_plan");
      sessionStorage.removeItem("fittrack_pending_answers");
      toast.success(`Successfully enrolled in ${planName} plan!`);
    } catch (err) {
      const msg = getErrorMessage(err);
      if (err.response?.status === 401) {
        toast.error("Session expired or token missing. Please sign in again.");
        sessionStorage.setItem("fittrack_pending_plan", planName);
        sessionStorage.setItem("fittrack_pending_answers", JSON.stringify(fitnessData));
        navigate(`/login?plan=${encodeURIComponent(planName)}`);
      } else if (err.response?.status === 409) {
        toast.error("You already have an active membership!");
        setActiveMembership({ planName });
      } else {
        toast.error(msg || "Enrollment failed. Please try again.");
      }
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="lp">
      {/* ── HEADER / NAV ─────────────────────────────── */}
      <header className="lp-header">
        <div className="lp-container lp-header-inner">
          <Link to="/" className="lp-wordmark" aria-label="FitTrack — home">
            <div className="lp-logo-icon">
              <IoFitnessOutline />
            </div>
            <span className="lp-logo-text">FitTrack</span>
          </Link>

          <nav className="lp-nav" aria-label="Main">
            <Link to="/for-members" style={{ color: "var(--lp-accent-light)", fontWeight: 600 }}>For Members</Link>
            <a href="#features">Features</a>
            <a href="#plans">Plans</a>
            <a href="#testimonials">Reviews</a>
            <a href="#faq">FAQ</a>
          </nav>

          <div className="lp-header-cta">
            {isAuthenticated && localStorage.getItem("fittrack_token") ? (
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {user?.role === "ADMIN" || user?.role === "SUPERADMIN" ? (
                  <Link to="/dashboard" className="lp-btn lp-btn-primary lp-btn-sm">
                    Admin Dashboard
                  </Link>
                ) : (
                  <Link to="/for-members" className="lp-btn lp-btn-primary lp-btn-sm">
                    Member Portal
                  </Link>
                )}
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    toast.success("Signed out successfully.");
                  }}
                  className="lp-btn lp-btn-ghost lp-btn-sm"
                >
                  Sign Out
                </button>
                <ThemeToggle className="lp-theme-toggle" />
              </div>
            ) : (
              <>
                <Link to="/register" className="lp-btn lp-btn-primary lp-btn-sm">
                  Get Started
                </Link>
                <Link to="/login" className="lp-btn lp-btn-ghost lp-btn-sm">
                  Sign In
                </Link>
                <ThemeToggle className="lp-theme-toggle" />
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── HERO SECTION ─────────────────────────────── */}
      <section className="lp-hero" id="hero">
        <div className="lp-hero-photo" aria-hidden="true" />
        <div className="lp-hero-shade" aria-hidden="true" />

        <div className="lp-container lp-hero-inner">
          <div className="lp-hero-copy">
            <h1>
              Your Strongest Self Starts{" "}
              <span className="lp-lit">Here.</span>
            </h1>
            <p className="lp-hero-lede">
              Train smarter with personalized workouts, expert trainers, fitness
              tracking, classes and everything you need to make progress every
              day.
            </p>
            <div className="lp-hero-cta">
              <Link
                to="/register"
                className="lp-btn lp-btn-primary lp-btn-arrow"
              >
                <span>Start Your Journey</span>
                <HiOutlineArrowRight className="lp-btn-arrow-icon" />
              </Link>
              <a
                href="#features"
                className="lp-btn lp-btn-ghost lp-btn-arrow"
              >
                <span>Explore Features</span>
                <HiOutlineArrowRight className="lp-btn-arrow-icon" />
              </a>
            </div>
          </div>

          {/* Floating workout card */}
          <aside className="lp-workout-card" aria-label="Today's workout">
            <div className="lp-wc-top">
              <div>
                <p className="lp-wc-kicker">Today's workout</p>
                <p className="lp-wc-title">Hypertrophy Push</p>
              </div>
              <span className="lp-live">Live</span>
            </div>
            <div className="lp-wc-mid">
              <svg className="lp-ring" viewBox="0 0 120 120" aria-hidden="true">
                <circle cx="60" cy="60" r="48" />
                <circle className="lp-ring-val" cx="60" cy="60" r="48" />
                <text x="60" y="56" textAnchor="middle">72%</text>
                <text x="60" y="74" textAnchor="middle" className="lp-ring-sub">
                  done
                </text>
              </svg>
              <div className="lp-wc-meta">
                <p>4/8 Exercises done</p>
                <p className="lp-muted">38 mins elapsed</p>
              </div>
            </div>
            <div className="lp-wc-stats">
              <div>
                <span className="lp-muted">Burned</span>
                <b>486 kcal</b>
              </div>
              <div>
                <span className="lp-muted">Streak</span>
                <b>8 Days</b>
              </div>
            </div>
          </aside>
        </div>

        <div className="lp-hero-base">
          <div className="lp-container lp-hero-base-inner">
            <p><b>10K+</b> members getting stronger</p>
            <p className="lp-scroll-hint">Scroll to explore ↓</p>
          </div>
        </div>
      </section>

      {/* ── TRANSFORM SECTION ────────────────────────── */}
      <section className="lp-transform" ref={revealTransform}>
        <div className="lp-container lp-transform-content reveal-el">
          <h2 className="lp-display">
            We Are <span className="lp-lit">Transforming</span> the Way You
            Train.
          </h2>
          <p className="lp-lede">
            FitTrack brings your workouts, fitness data, gym visits,
            memberships and trainer-led classes into one connected fitness
            experience.
          </p>
          <ul className="lp-purpose">
            <li>Train with Purpose.</li>
            <li>Track Your Progress.</li>
            <li>Build Consistency.</li>
          </ul>
        </div>

        {/* Stats bar */}
        <div className="lp-container">
          <div className="lp-stat-bar">
            <StatCounter target={10000} suffix="+" label="Members" />
            <StatCounter target={12} suffix="+" label="Workouts" />
            <StatCounter target={8} suffix=" days" label="Streak" />
            <StatCounter target={82} suffix="%" label="Consistency" />
          </div>
        </div>
      </section>

      {/* ── FEATURES SECTION ─────────────────────────── */}
      <section className="lp-features" id="features" ref={revealFeatures}>
        <div className="lp-container reveal-el">
          <p className="lp-eyebrow lp-lit">Everything That Moves Forward.</p>
          <h2 className="lp-display">
            One Connected Experience.
          </h2>
          <p className="lp-lede lp-lede-center">
            Your workouts, health, progress and gym journey — all in one place.
          </p>

          <div className="lp-engine-grid">
            <article className="lp-engine">
              <p className="lp-engine-kicker">
                <span className="lp-lit">01 / Progress</span>
                <span>Analytics Engine</span>
              </p>
              <div className="lp-engine-icon-wrap primary">
                <HiOutlineChartBar />
              </div>
              <h3>See Your Progress.</h3>
              <p className="lp-muted">
                Track workouts, calories, consistency, strength and fitness
                trends so every session contributes to a bigger picture.
              </p>
              <div className="lp-mini-chart" aria-hidden="true">
                <svg viewBox="0 0 280 90" preserveAspectRatio="none">
                  <polyline points="0,70 40,62 80,66 120,40 160,48 200,22 240,28 280,12" />
                </svg>
                <span>+18.4% this month</span>
              </div>
            </article>

            <article className="lp-engine">
              <p className="lp-engine-kicker">
                <span className="lp-lit">02 / Training</span>
                <span>Performance Engine</span>
              </p>
              <div className="lp-engine-icon-wrap emerald">
                <HiOutlineBolt />
              </div>
              <h3>Train with Purpose.</h3>
              <p className="lp-muted">
                Follow your daily workouts, understand what to train and stay
                consistent with your fitness routine.
              </p>
              <div className="lp-sets">
                <div className="lp-set-row">
                  <span>10 reps · 100 kg</span><b>Set 01</b>
                </div>
                <div className="lp-set-row">
                  <span>8 reps · 120 kg</span><b>Set 02</b>
                </div>
                <div className="lp-set-row on">
                  <span>6 reps · 140 kg</span><b>Set 03</b>
                </div>
              </div>
            </article>

            <article className="lp-engine">
              <p className="lp-engine-kicker">
                <span className="lp-lit">03 / Health</span>
                <span>Biometric Feedback</span>
              </p>
              <div className="lp-engine-icon-wrap rose">
                <HiOutlineHeart />
              </div>
              <h3>Know Your Body.</h3>
              <p className="lp-muted">
                Connect health and fitness data to understand activity, heart
                rate, steps, calories, distance, sleep and more.
              </p>
              <div className="lp-bios">
                <span>Heart rate <b>81 BPM</b></span>
                <span>Steps <b>2,010</b></span>
                <span>Sleep <b>6h 02m</b></span>
              </div>
            </article>

            <article className="lp-engine">
              <p className="lp-engine-kicker">
                <span className="lp-lit">04 / Gym Experience</span>
                <span>Connected Platform</span>
              </p>
              <div className="lp-engine-icon-wrap cyan">
                <HiOutlineUserGroup />
              </div>
              <h3>Your Gym. Connected.</h3>
              <p className="lp-muted">
                Manage visits, memberships, classes, trainers and your daily
                gym experience from one connected platform.
              </p>
              <p className="lp-eco">
                Gym → Membership → Classes → Visits → Fitness
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* ── CONNECTED FEATURES GRID ──────────────────── */}
      <section className="lp-connected">
        <div className="lp-container">
          <h2 className="lp-display">Always Connected.</h2>
          <p className="lp-eyebrow lp-lit">
            Everything you need. Everywhere you train.
          </p>
          <div className="lp-connected-grid">
            <div className="lp-feat-col">
              {[
                {
                  n: "01",
                  title: "Stay on Track",
                  desc: "See today's workout, complete daily fitness tasks and keep your routine moving forward.",
                  icon: HiOutlineClipboardDocumentList,
                },
                {
                  n: "02",
                  title: "Know Your Progress",
                  desc: "Track workouts, consistency, calories, activity and the metrics that matter to your goals.",
                  icon: HiOutlineChartBar,
                },
                {
                  n: "03",
                  title: "Your Health, Connected",
                  desc: "Keep steps, heart rate, calories, sleep, distance and fitness data connected to your training.",
                  icon: HiOutlineHeart,
                },
              ].map((f) => (
                <article key={f.n} className="lp-feat-card">
                  <p className="lp-feat-n">{f.n}</p>
                  <h3>{f.title}</h3>
                  <p className="lp-muted">{f.desc}</p>
                </article>
              ))}
            </div>

            {/* Phone mockup */}
            <div className="lp-phone-wrap">
              <div className="lp-phone">
                <div className="lp-notch" />
                <p className="lp-ph-kicker">Current gym · FitTrack Studio</p>
                <h3>Hi, John</h3>
                <p className="lp-muted">Ready for your evening training session?</p>
                <div className="lp-ph-actions">
                  <span className="lp-ph-tab active">Workout</span>
                  <span className="lp-ph-tab">Metrics</span>
                </div>
                <div className="lp-ph-health">
                  <div><span>Calories</span><b>482</b></div>
                  <div><span>Heart rate</span><b>134</b></div>
                </div>
                <p className="lp-ph-mem">Premium membership · Active</p>
                <p className="lp-ph-checkin">Check in</p>
              </div>
            </div>

            <div className="lp-feat-col">
              {[
                {
                  n: "04",
                  title: "Check In & Go",
                  desc: "Check in at your gym, track visits and build a consistent weekly attendance streak.",
                  icon: HiOutlineCalendarDays,
                },
                {
                  n: "05",
                  title: "Membership Simplified",
                  desc: "View your active membership, expiration date, available plans and payment information.",
                  icon: HiOutlineCreditCard,
                },
                {
                  n: "06",
                  title: "Never Miss a Session",
                  desc: "Follow trainer-led workouts, explore your weekly schedule and book available gym classes.",
                  icon: HiOutlineAcademicCap,
                },
              ].map((f) => (
                <article key={f.n} className="lp-feat-card">
                  <p className="lp-feat-n">{f.n}</p>
                  <h3>{f.title}</h3>
                  <p className="lp-muted">{f.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── PLANS SECTION ────────────────────────────── */}
      <section className="lp-plans" id="plans" ref={revealPlans}>
        <div className="lp-container reveal-el">
          <p className="lp-eyebrow">Membership Plans · 10K+ Members</p>
          <h2 className="lp-display">
            Find the Plan That <span className="lp-lit">Moves You Forward.</span>
          </h2>
          <p className="lp-lede">
            Choose the membership that fits your training goals and get more from
            every visit.
          </p>

          <div className="lp-plan-grid">
            {[
              {
                name: "Monthly",
                rawPrice: 1500,
                per: "/ month",
                desc: "Flexible month-to-month access",
                features: [
                  "Gym access",
                  "Daily workout guidance",
                  "Fitness tracking",
                  "Visit tracking",
                  "Membership management",
                  "Basic class access",
                ],
              },
              {
                name: "Quarterly",
                rawPrice: 4000,
                per: "/ 3 months",
                desc: "Our most popular training plan",
                badge: "Most Popular",
                featured: true,
                features: [
                  "Everything in Monthly",
                  "Trainer-led workouts",
                  "Priority class access",
                  "Advanced fitness tracking",
                  "Progress insights",
                  "Nutrition guidance",
                ],
              },
              {
                name: "Half Yearly",
                rawPrice: 7500,
                per: "/ 6 months",
                desc: "Committed to your fitness journey",
                badge: "Save 20%",
                features: [
                  "Everything in Quarterly",
                  "Personalized workout planning",
                  "Advanced progress tracking",
                  "Health & fitness sync",
                  "Priority support",
                  "Additional member benefits",
                ],
              },
              {
                name: "Annual",
                rawPrice: 14000,
                per: "/ year",
                desc: "The ultimate fitness commitment",
                badge: "Best Value",
                features: [
                  "Everything in Half Yearly",
                  "Premium training support",
                  "Personalized fitness guidance",
                  "Exclusive member benefits",
                  "Priority access",
                  "Best overall value",
                ],
              },
            ].map((plan) => {
              const discount = planDiscountMap[plan.name];
              const hasDiscount = Boolean(discount);
              const origPrice = plan.rawPrice;
              const discountPct = discount?.discountPercentage || 0;
              const discPrice = discount?.discountedPrice ?? (origPrice - Math.round((origPrice * discountPct) / 100));

              return (
                <article
                  key={plan.name}
                  className={`lp-plan ${plan.featured ? "lp-plan-featured" : ""} ${hasDiscount ? "lp-plan-discounted-card" : ""}`}
                >
                  <div className="lp-plan-top">
                    <h3>{plan.name}</h3>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      {hasDiscount && (
                        <span className="lp-pill lp-pill-discount">
                          🔥 {discountPct}% OFF
                        </span>
                      )}
                      {plan.badge && !hasDiscount && (
                        <span className="lp-pill">{plan.badge}</span>
                      )}
                    </div>
                  </div>
                  <p className="lp-muted">{plan.desc}</p>

                  {hasDiscount ? (
                    <div className="lp-plan-price-wrapper">
                      <span className="lp-plan-old-price">₹{origPrice.toLocaleString("en-IN")}</span>
                      <p className="lp-plan-price lp-plan-discounted">
                        ₹{discPrice.toLocaleString("en-IN")}
                        <small>{plan.per}</small>
                      </p>
                      <span className="lp-discount-badge-percent">
                        Save ₹{(origPrice - discPrice).toLocaleString("en-IN")} ({discountPct}% OFF)
                      </span>
                      {discount.endDate && (
                        <span className="lp-discount-expiry">
                          ⏱️ Valid till {new Date(discount.endDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <p className="lp-plan-price">
                      ₹{origPrice.toLocaleString("en-IN")}
                      <small>{plan.per}</small>
                    </p>
                  )}

                  <ul>
                    {plan.features.map((f) => (
                      <li key={f}>
                        <HiOutlineCheck className="lp-check-icon" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {activeMembership?.planName === plan.name ? (
                    <span className="lp-btn lp-btn-enrolled">
                      <HiOutlineCheckCircle style={{ fontSize: '1.1em' }} /> Enrolled
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleChoosePlan(plan.name)}
                      disabled={enrolling}
                      className={`lp-btn ${plan.featured || hasDiscount ? "lp-btn-primary" : "lp-btn-ghost"}`}
                    >
                      {enrolling ? "Enrolling…" : hasDiscount ? `Choose Plan (${discountPct}% OFF)` : "Choose Plan"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section className="lp-testimonials" id="testimonials" ref={revealTestimonials}>
        <div className="lp-container reveal-el">
          <h2 className="lp-display">Real People. Real Progress.</h2>
          <p className="lp-lede">
            See how FitTrack helps members build consistency, improve their
            fitness and stay committed to their goals.
          </p>

          <div className="lp-quotes">
            {[
              {
                initials: "AM",
                name: "Aarav Mehta",
                info: "29 · Member since 2024",
                text: "The workouts keep me consistent, and being able to track my progress makes every session feel meaningful.",
                focus: "Consistency",
              },
              {
                initials: "PS",
                name: "Priyanshu Sharma",
                info: "34 · Member since 2023",
                text: "I love how everything connects — my gym visits, workouts and health data all in one place. It changed how I train.",
                focus: "Strength",
              },
              {
                initials: "RP",
                name: "Rohit Patidar",
                info: "31 · Member since 2024",
                text: "The daily tasks and streak tracking keep me accountable. I have not missed a week in three months.",
                focus: "Weight Loss",
              },
              {
                initials: "AR",
                name: "Ananya Rao",
                info: "26 · Member since 2024",
                text: "Having my trainer and membership connected makes the gym experience easier to stick with.",
                focus: "Performance",
              },
            ].map((q) => (
              <blockquote key={q.initials} className="lp-quote">
                <p className="lp-quote-mark" aria-hidden="true">"</p>
                <div className="lp-avatar">{q.initials}</div>
                <p className="lp-quote-name">{q.name}</p>
                <p className="lp-muted">{q.info}</p>
                <p>{q.text}</p>
                <p className="lp-focus">Focus: {q.focus}</p>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ───────────────────────────────────────── */}
      <section className="lp-faq-section" id="faq" ref={revealFaq}>
        <div className="lp-container lp-faq-split reveal-el">
          <div className="lp-faq-intro">
            <h2 className="lp-display">Frequently Asked Questions</h2>
            <p className="lp-lede">
              Everything you need to know about joining, training, memberships,
              classes and using FitTrack.
            </p>
          </div>

          <div className="lp-faq-list">
            <FaqItem
              num="01"
              question="How do I join FitTrack?"
              answer="Sign up on the website or download the member app. Your gym admin can also add you directly when you visit."
            />
            <FaqItem
              num="02"
              question="Which membership plan is right for me?"
              answer="If you're just starting out, the Monthly plan gives you full access. The Quarterly plan is our most popular — it's great for committed members who want trainer-led workouts."
            />
            <FaqItem
              num="03"
              question="How do I check in at my gym?"
              answer="Open the FitTrack app when you arrive and tap Check In. Your location is verified against the gym's boundary. If GPS is struggling, scan the QR code at the front desk."
            />
            <FaqItem
              num="04"
              question="Can I book or join a fitness class?"
              answer="Yes! Classes have a capacity limit and automatically waitlist when full. You get promoted when someone drops out."
            />
            <FaqItem
              num="05"
              question="How do I track my workouts and progress?"
              answer="Your daily workout appears in the app as soon as your trainer assigns it. Visits, minutes, calories and weekly trends live under the Progress tab."
            />
            <FaqItem
              num="06"
              question="How do I manage or renew my membership?"
              answer="Open Membership in the app to see your active plan, expiry date and renewal options. You can also pay directly through UPI."
            />
          </div>
        </div>
      </section>

      {/* ── FINALE CTA ────────────────────────────────── */}
      <section className="lp-finale">
        <div className="lp-finale-photo" aria-hidden="true" />
        <div className="lp-finale-shade" aria-hidden="true" />
        <div className="lp-container lp-finale-inner">
          <div className="lp-finale-copy">
            <h2 className="lp-display lp-finale-heading">
              <span className="lp-finale-line">Your Next Level</span>
              <span className="lp-finale-line-accent">Starts Here.</span>
            </h2>
            <p className="lp-finale-desc">
              Train smarter. Stay consistent. Track your progress. Make every
              session count with FitTrack.
            </p>
            <div className="lp-finale-cta">
              <Link
                to="/register"
                className="lp-btn lp-btn-primary lp-btn-arrow"
              >
                <span>Get Started Now</span>
                <HiOutlineArrowRight className="lp-btn-arrow-icon" />
              </Link>
              <Link
                to="/for-members"
                className="lp-btn lp-btn-ghost lp-btn-arrow"
              >
                <span>Explore Member App</span>
                <HiOutlineArrowRight className="lp-btn-arrow-icon" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-grid">
            <div className="lp-footer-brand">
              <p className="lp-footer-name">FitTrack</p>
              <p className="lp-muted">
                A connected fitness experience for training, progress, gym
                visits, classes and membership management.
              </p>
            </div>

            <div className="lp-footer-col">
              <p className="lp-eyebrow">Navigate</p>
              <Link to="/" className="lp-muted">Home</Link>
              <Link to="/for-members" className="lp-muted">For Members</Link>
              <Link to="/register" className="lp-muted">Register</Link>
              <Link to="/login" className="lp-muted">Sign In</Link>
            </div>

            <div className="lp-footer-col">
              <p className="lp-eyebrow">Features</p>
              <a href="#features" className="lp-muted">Workouts</a>
              <a href="#features" className="lp-muted">Progress</a>
              <a href="#features" className="lp-muted">Health</a>
              <a href="#plans" className="lp-muted">Plans</a>
            </div>

            <div className="lp-footer-col">
              <p className="lp-eyebrow">Support</p>
              <a href="#faq" className="lp-muted">FAQs</a>
              <Link to="/login" className="lp-muted">Sign In</Link>
            </div>
          </div>

          <hr className="lp-rule" />
          <div className="lp-copyright-row">
            <p className="lp-muted">
              © {new Date().getFullYear()} FitTrack. Train. Track. Transform.
            </p>
            <a href="#hero" className="lp-to-top" aria-label="Back to top">↑</a>
          </div>
        </div>
      </footer>
      {/* ── FITNESS QUESTIONNAIRE MODAL ────────────── */}
      {showQuestionnaire && (
        <div className="lp-modal-overlay" onClick={() => setShowQuestionnaire(false)}>
          <div className="lp-modal lp-questionnaire-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="lp-modal-close"
              onClick={() => setShowQuestionnaire(false)}
              aria-label="Close"
            >
              <HiXMark />
            </button>

            {/* Progress Bar */}
            <div className="lp-q-progress">
              {questionnaireSteps.map((_, i) => (
                <div
                  key={i}
                  className={`lp-q-progress-dot ${i <= questionStep ? "active" : ""} ${i < questionStep ? "done" : ""}`}
                />
              ))}
            </div>

            <div className="lp-q-step-label">
              Step {questionStep + 1} of {questionnaireSteps.length}
            </div>

            {questionStep < questionnaireSteps.length ? (
              <>
                <div className="lp-q-icon">{questionnaireSteps[questionStep].icon}</div>
                <h3 className="lp-modal-title">{questionnaireSteps[questionStep].question}</h3>
                <p className="lp-modal-subtitle" style={{ marginBottom: 20 }}>
                  Enrolling in <strong>{selectedPlanName}</strong> plan
                  {planDiscountMap[selectedPlanName] && (
                    <span className="lp-q-discount-tag">
                      {" "}· ₹{planDiscountMap[selectedPlanName].discountedPrice?.toLocaleString("en-IN")} ({planDiscountMap[selectedPlanName].discountPercentage}% OFF)
                    </span>
                  )}
                </p>

                <div className="lp-q-options">
                  {questionnaireSteps[questionStep].options.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      className={`lp-q-option ${fitnessAnswers[questionnaireSteps[questionStep].key] === opt.value ? "selected" : ""}`}
                      onClick={() => handleQuestionSelect(questionnaireSteps[questionStep].key, opt.value)}
                    >
                      <span className="lp-q-option-emoji">{opt.emoji}</span>
                      <div className="lp-q-option-text">
                        <strong>{opt.label}</strong>
                        <span>{opt.desc}</span>
                      </div>
                      {fitnessAnswers[questionnaireSteps[questionStep].key] === opt.value && (
                        <HiOutlineCheckCircle className="lp-q-option-check" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="lp-q-nav">
                  {questionStep > 0 && (
                    <button
                      type="button"
                      className="lp-btn lp-btn-ghost"
                      onClick={() => setQuestionStep((s) => s - 1)}
                    >
                      ← Back
                    </button>
                  )}
                  {questionStep === questionnaireSteps.length - 1 && fitnessAnswers.dietPreference && (
                    <button
                      type="button"
                      className="lp-btn lp-btn-primary"
                      onClick={handleQuestionnaireSubmit}
                    >
                      Complete Enrollment <HiOutlineArrowRight />
                    </button>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ── ENROLLMENT SUCCESS MODAL ──────────────── */}
      {showSuccessModal && enrolledPlan && (
        <div className="lp-modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="lp-modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="lp-modal-close"
              onClick={() => setShowSuccessModal(false)}
              aria-label="Close"
            >
              <HiXMark />
            </button>
            <div className="lp-modal-icon">
              <HiOutlineCheckCircle />
            </div>
            <h3 className="lp-modal-title">Welcome to FitTrack!</h3>
            <p className="lp-modal-subtitle">
              You've been successfully enrolled in the{" "}
              <strong>{enrolledPlan.planName}</strong> plan.
            </p>
            <div className="lp-modal-details">
              <div className="lp-modal-detail-row">
                <span>Plan</span>
                <strong>{enrolledPlan.planName}</strong>
              </div>
              <div className="lp-modal-detail-row">
                <span>Price</span>
                <strong>₹{enrolledPlan.planPrice?.toLocaleString("en-IN")}</strong>
              </div>
              {enrolledPlan.originalPrice && enrolledPlan.originalPrice > enrolledPlan.planPrice && (
                <div className="lp-modal-detail-row">
                  <span>Discount Applied</span>
                  <strong style={{ color: "#10B981" }}>
                    {enrolledPlan.discountPercentage}% OFF (Saved ₹{(enrolledPlan.originalPrice - enrolledPlan.planPrice).toLocaleString("en-IN")})
                  </strong>
                </div>
              )}
              <div className="lp-modal-detail-row">
                <span>Valid Until</span>
                <strong>
                  {new Date(enrolledPlan.endDate).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </strong>
              </div>
            </div>
            <button
              className="lp-btn lp-btn-primary"
              style={{ width: "100%", marginTop: 16 }}
              onClick={() => {
                setShowSuccessModal(false);
                navigate("/for-members");
              }}
            >
              Go to Member Portal <HiOutlineArrowRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
