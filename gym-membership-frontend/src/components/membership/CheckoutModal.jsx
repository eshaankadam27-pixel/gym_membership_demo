import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  HiOutlineCheckCircle,
  HiOutlineArrowRight,
  HiOutlineArrowLeft,
  HiOutlineCreditCard,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiXMark,
  HiOutlineBanknotes,
  HiOutlineBuildingLibrary,
  HiOutlineBolt,
  HiOutlineCheck,
} from "react-icons/hi2";
import toast from "react-hot-toast";
import { enrollInPlan } from "../../services/membershipService";
import { getErrorMessage } from "../../utils/formatters";
import "../../styles/checkout-modal.css";

const PLAN_PRICING = {
  Monthly: { price: 1500, duration: "30 Days (1 Month)" },
  Quarterly: { price: 4000, duration: "90 Days (3 Months)" },
  "Half Yearly": { price: 7500, duration: "180 Days (6 Months)" },
  Annual: { price: 14000, duration: "365 Days (1 Year)" },
};

const QUESTIONNAIRE_STEPS = [
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

const PAYMENT_METHODS = [
  {
    id: "UPI",
    label: "UPI Payment",
    desc: "Google Pay, PhonePe, Paytm, QR",
    icon: HiOutlineBolt,
  },
  {
    id: "Credit Card",
    label: "Credit Card",
    desc: "Visa, Mastercard, RuPay",
    icon: HiOutlineCreditCard,
  },
  {
    id: "Debit Card",
    label: "Debit Card",
    desc: "All domestic bank cards",
    icon: HiOutlineCreditCard,
  },
  {
    id: "Net Banking",
    label: "Net Banking",
    desc: "HDFC, SBI, ICICI, Axis & more",
    icon: HiOutlineBuildingLibrary,
  },
  {
    id: "Cash",
    label: "Pay at Gym Desk",
    desc: "Pay counter in cash",
    icon: HiOutlineBanknotes,
  },
];

const CheckoutModal = ({
  isOpen,
  onClose,
  planName = "Quarterly",
  discount = null,
  onSuccess,
}) => {
  const navigate = useNavigate();

  // Stages: "questionnaire" -> "payment" -> "processing" -> "success"
  const [stage, setStage] = useState("questionnaire");
  const [questionStep, setQuestionStep] = useState(0);
  const [fitnessAnswers, setFitnessAnswers] = useState({
    fitnessGoal: "general_fitness",
    fitnessLevel: "beginner",
    bodyFocus: "full_body",
    dietPreference: "vegetarian",
  });
  const [selectedMethod, setSelectedMethod] = useState("UPI");
  const [processingStep, setProcessingStep] = useState(1);
  const [enrolledMembership, setEnrolledMembership] = useState(null);

  // Reset all state whenever the modal is opened fresh
  useEffect(() => {
    if (isOpen) {
      setStage("questionnaire");
      setQuestionStep(0);
      setFitnessAnswers({
        fitnessGoal: "general_fitness",
        fitnessLevel: "beginner",
        bodyFocus: "full_body",
        dietPreference: "vegetarian",
      });
      setSelectedMethod("UPI");
      setProcessingStep(1);
      setEnrolledMembership(null);
    }
  }, [isOpen]);

  // Pricing calculations
  const pricing = useMemo(() => {
    const config = PLAN_PRICING[planName] || { price: 4000, duration: "90 Days" };
    const rawPrice = config.price;
    const discountPct = discount?.discountPercentage || 0;
    const discountAmount = discountPct > 0 ? Math.round((rawPrice * discountPct) / 100) : 0;
    const finalPrice = discount?.discountedPrice ?? rawPrice - discountAmount;

    return {
      rawPrice,
      discountPct,
      discountAmount,
      finalPrice,
      duration: config.duration,
    };
  }, [planName, discount]);

  if (!isOpen) return null;

  // Handle question select
  const handleQuestionSelect = (key, value) => {
    setFitnessAnswers((prev) => ({ ...prev, [key]: value }));
    setTimeout(() => {
      if (questionStep < QUESTIONNAIRE_STEPS.length - 1) {
        setQuestionStep((s) => s + 1);
      } else {
        // Automatically go to payment step after answering all questions
        setStage("payment");
      }
    }, 280);
  };

  // Execute payment & enrollment
  const handleProceedPayment = async () => {
    setStage("processing");
    setProcessingStep(1);

    // Simulate realistic payment verification steps
    setTimeout(() => {
      setProcessingStep(2);
    }, 600);

    setTimeout(async () => {
      setProcessingStep(3);
      try {
        const payload = {
          planName,
          paymentMethod: selectedMethod,
          fitnessGoal: fitnessAnswers.fitnessGoal || undefined,
          fitnessLevel: fitnessAnswers.fitnessLevel || undefined,
          bodyFocus: fitnessAnswers.bodyFocus || undefined,
          dietPreference: fitnessAnswers.dietPreference || undefined,
        };

        const res = await enrollInPlan(payload);
        // Only use the nested data object (not the full ApiResponse wrapper)
        const data = res.data?.data;

        setEnrolledMembership(data);
        setStage("success");
        toast.success("Payment Done! Membership added successfully! 🎉");

        if (onSuccess) {
          onSuccess(data);
        }
      } catch (err) {
        const msg = getErrorMessage(err);
        toast.error(msg || "Payment processing failed. Please try again.");
        setStage("payment");
      }
    }, 1200);
  };

  const handleFinish = (targetPath = "/for-members") => {
    onClose();
    if (targetPath) {
      navigate(targetPath);
    }
  };

  return (
    <div className="cm-overlay" onClick={stage !== "processing" ? onClose : undefined}>
      <div className="cm-modal" onClick={(e) => e.stopPropagation()}>
        {stage !== "processing" && (
          <button
            type="button"
            className="cm-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <HiXMark />
          </button>
        )}

        {/* ── STAGE 1: QUESTIONNAIRE ──────────────────────── */}
        {stage === "questionnaire" && (
          <div>
            <div className="cm-header">
              <div className="cm-tag-badge">
                <HiOutlineSparkles /> Step 1: Personalize Your Plan
              </div>
              <h2 className="cm-title">{QUESTIONNAIRE_STEPS[questionStep].question}</h2>
              <p className="cm-subtitle">
                Customizing workouts for your <strong>{planName}</strong> plan
              </p>
            </div>

            {/* Progress Bar */}
            <div className="cm-progress">
              {QUESTIONNAIRE_STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`cm-progress-dot ${i <= questionStep ? "active" : ""} ${
                    i < questionStep ? "done" : ""
                  }`}
                />
              ))}
            </div>
            <div className="cm-q-step-counter">
              Question {questionStep + 1} of {QUESTIONNAIRE_STEPS.length}
            </div>

            <div className="cm-q-options">
              {QUESTIONNAIRE_STEPS[questionStep].options.map((opt) => {
                const isSelected =
                  fitnessAnswers[QUESTIONNAIRE_STEPS[questionStep].key] === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    className={`cm-q-option ${isSelected ? "selected" : ""}`}
                    onClick={() =>
                      handleQuestionSelect(QUESTIONNAIRE_STEPS[questionStep].key, opt.value)
                    }
                  >
                    <span className="cm-q-emoji">{opt.emoji}</span>
                    <div className="cm-q-info">
                      <strong>{opt.label}</strong>
                      <span>{opt.desc}</span>
                    </div>
                    {isSelected && <HiOutlineCheck className="cm-q-check" />}
                  </button>
                );
              })}
            </div>

            <div className="cm-footer-nav">
              {questionStep > 0 ? (
                <button
                  type="button"
                  className="cm-btn-ghost"
                  onClick={() => setQuestionStep((s) => s - 1)}
                >
                  <HiOutlineArrowLeft /> Back
                </button>
              ) : (
                <div />
              )}

              <button
                type="button"
                className="cm-btn-skip"
                onClick={() => setStage("payment")}
              >
                Skip to Payment →
              </button>

              {questionStep < QUESTIONNAIRE_STEPS.length - 1 ? (
                <button
                  type="button"
                  className="cm-btn-primary"
                  onClick={() => setQuestionStep((s) => s + 1)}
                >
                  Next <HiOutlineArrowRight />
                </button>
              ) : (
                <button
                  type="button"
                  className="cm-btn-primary"
                  onClick={() => setStage("payment")}
                >
                  Proceed to Payment <HiOutlineArrowRight />
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── STAGE 2: PROCEED FOR PAYMENT ─────────────────── */}
        {stage === "payment" && (
          <div>
            <div className="cm-header">
              <div className="cm-tag-badge">
                <HiOutlineShieldCheck /> Step 2: Checkout & Payment
              </div>
              <h2 className="cm-title">Proceed for Payment</h2>
              <p className="cm-subtitle">
                Complete your checkout to activate your <strong>{planName}</strong> plan
              </p>
            </div>

            {/* Order Summary */}
            <div className="cm-order-summary">
              <div className="cm-order-row">
                <span>Selected Plan</span>
                <strong>{planName} Membership</strong>
              </div>
              <div className="cm-order-row">
                <span>Plan Duration</span>
                <strong>{pricing.duration}</strong>
              </div>
              <div className="cm-order-row">
                <span>Base Price</span>
                <strong>₹{pricing.rawPrice.toLocaleString("en-IN")}</strong>
              </div>
              {pricing.discountAmount > 0 && (
                <div className="cm-order-row highlight-disc">
                  <span>Discount Applied ({pricing.discountPct}% OFF)</span>
                  <span>-₹{pricing.discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="cm-order-row total-row">
                <span>Total Amount to Pay</span>
                <span className="cm-total-amt">
                  {pricing.discountAmount > 0 && (
                    <span className="old-price-strike">
                      ₹{pricing.rawPrice.toLocaleString("en-IN")}
                    </span>
                  )}
                  ₹{pricing.finalPrice.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <span className="cm-section-label">Select Payment Method</span>
            <div className="cm-methods-grid">
              {PAYMENT_METHODS.map((method) => {
                const IconComponent = method.icon;
                const isSelected = selectedMethod === method.id;
                return (
                  <div
                    key={method.id}
                    className={`cm-method-card ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <IconComponent className="cm-method-icon" />
                    <div className="cm-method-info">
                      <strong>{method.label}</strong>
                      <span>{method.desc}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Simulated Demo Notice */}
            <div className="cm-demo-box">
              <HiOutlineShieldCheck className="cm-demo-box-icon" />
              <div>
                <strong>Simulated Instant Payment (Demo Mode):</strong>
                <div>
                  No real banking gateway required. Clicking <strong>Proceed for Payment</strong> will instantly verify transaction and activate your membership plan.
                </div>
              </div>
            </div>

            {/* Bottom buttons */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                className="cm-btn-ghost"
                onClick={() => setStage("questionnaire")}
              >
                <HiOutlineArrowLeft /> Back
              </button>
              <button
                type="button"
                className="cm-proceed-btn"
                onClick={handleProceedPayment}
              >
                <span>Proceed for Payment • Pay ₹{pricing.finalPrice.toLocaleString("en-IN")}</span>
                <HiOutlineArrowRight />
              </button>
            </div>
          </div>
        )}

        {/* ── STAGE 3: PROCESSING STATE ─────────────────────── */}
        {stage === "processing" && (
          <div className="cm-processing-wrap">
            <div className="cm-spinner-ring" />
            <h3 className="cm-proc-title">Processing Payment…</h3>
            <p className="cm-proc-desc">
              Please wait while we simulate payment authorization and activate your plan.
            </p>

            <div className="cm-proc-steps">
              <div className={`cm-proc-step-item ${processingStep >= 1 ? "active" : ""}`}>
                {processingStep > 1 ? "✅" : "⏳"} Authorizing {selectedMethod} Transaction…
              </div>
              <div className={`cm-proc-step-item ${processingStep >= 2 ? "active" : ""}`}>
                {processingStep > 2 ? "✅" : processingStep === 2 ? "⏳" : "⚪"} Generating payment receipt of ₹
                {pricing.finalPrice.toLocaleString("en-IN")}…
              </div>
              <div className={`cm-proc-step-item ${processingStep >= 3 ? "active" : ""}`}>
                {processingStep === 3 ? "⏳" : "⚪"} Adding Membership to your account…
              </div>
            </div>
          </div>
        )}

        {/* ── STAGE 4: PAYMENT DONE & MEMBERSHIP ADDED ──────── */}
        {stage === "success" && (
          <div className="cm-success-wrap">
            <div className="cm-success-badge">
              <HiOutlineCheckCircle />
            </div>
            <h2 className="cm-success-title">Payment Done! 🎉</h2>
            <div className="cm-success-sub">Membership Added Successfully</div>

            {/* Receipt Summary Card */}
            <div className="cm-receipt-card">
              <div className="cm-receipt-row">
                <span>Transaction Status</span>
                <span className="cm-receipt-status">
                  <HiOutlineCheck /> Payment SUCCESS
                </span>
              </div>
              <div className="cm-receipt-row">
                <span>Transaction ID</span>
                <strong>
                  {enrolledMembership?.payment?.transactionId ||
                    `TXN-${Date.now().toString().slice(-6)}-SUCCESS`}
                </strong>
              </div>
              <div className="cm-receipt-row">
                <span>Membership Plan</span>
                <strong>{enrolledMembership?.planName || planName}</strong>
              </div>
              <div className="cm-receipt-row">
                <span>Amount Paid</span>
                <strong style={{ color: "#10b981", fontSize: "1.05rem" }}>
                  ₹{(enrolledMembership?.planPrice ?? pricing.finalPrice).toLocaleString("en-IN")}
                </strong>
              </div>
              <div className="cm-receipt-row">
                <span>Payment Mode</span>
                <strong>{selectedMethod}</strong>
              </div>
              <div className="cm-receipt-row">
                <span>Valid Until</span>
                <strong>
                  {enrolledMembership?.endDate
                    ? new Date(enrolledMembership.endDate).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "Active for " + pricing.duration}
                </strong>
              </div>
            </div>

            <div className="cm-success-actions">
              <button
                type="button"
                className="cm-btn-portal"
                onClick={() => handleFinish("/for-members")}
              >
                <span>Go to Member Portal (Unlocked)</span>
                <HiOutlineArrowRight />
              </button>
              <button
                type="button"
                className="cm-btn-ghost"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => handleFinish(null)}
              >
                Done • Stay on Home Page
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutModal;
