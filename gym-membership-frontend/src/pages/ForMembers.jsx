import { useState, useEffect, useMemo } from "react";
import { Link, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { IoFitnessOutline } from "react-icons/io5";
import {
  HiOutlineCheck,
  HiOutlineBolt,
  HiOutlineSparkles,
  HiOutlineCalendarDays,
  HiOutlineClipboardDocumentList,
  HiOutlineCreditCard,
  HiOutlineBell,
  HiOutlineArrowRight,
  HiOutlineScale,
  HiOutlineBeaker,
  HiOutlineLockClosed,
} from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import { getMyMembership } from "../services/membershipService";
import { getActiveDiscounts } from "../services/discountService";
import ThemeToggle from "../components/ui/ThemeToggle";
import CheckoutModal from "../components/membership/CheckoutModal";
import "../styles/for-members.css";

/* ═══════════════════════════════════════════════════════
   TRAINING PLANS — keyed by fitnessGoal
   ═══════════════════════════════════════════════════════ */
const TRAINING_PLANS = {
  weight_loss: {
    title: "Weight Loss Program",
    subtitle: "Burn fat, build lean muscle, and boost metabolism",
    icon: "🔥",
    weeklySchedule: [
      { day: "Monday", name: "HIIT Cardio Blast", exercises: [
        { name: "Jump Squats", sets: "4 × 15", rest: "30s" },
        { name: "Mountain Climbers", sets: "4 × 30s", rest: "20s" },
        { name: "Burpees", sets: "3 × 12", rest: "45s" },
        { name: "Battle Ropes", sets: "4 × 30s", rest: "30s" },
        { name: "Plank Jacks", sets: "3 × 20", rest: "20s" },
      ]},
      { day: "Tuesday", name: "Strength + Core", exercises: [
        { name: "Deadlifts", sets: "4 × 10", rest: "60s" },
        { name: "Dumbbell Rows", sets: "3 × 12", rest: "45s" },
        { name: "Russian Twists", sets: "3 × 20", rest: "30s" },
        { name: "Leg Raises", sets: "3 × 15", rest: "30s" },
        { name: "Bicycle Crunches", sets: "3 × 20", rest: "30s" },
      ]},
      { day: "Wednesday", name: "Steady-State Cardio", exercises: [
        { name: "Treadmill Jog (6km/h)", sets: "20 min", rest: "—" },
        { name: "Cycling (Zone 2)", sets: "15 min", rest: "—" },
        { name: "Rowing Machine", sets: "10 min", rest: "—" },
        { name: "Stair Climber", sets: "10 min", rest: "—" },
      ]},
      { day: "Thursday", name: "Full Body Circuit", exercises: [
        { name: "Kettlebell Swings", sets: "4 × 15", rest: "30s" },
        { name: "Box Jumps", sets: "3 × 12", rest: "45s" },
        { name: "Push-ups", sets: "3 × 15", rest: "30s" },
        { name: "Lunges (Walking)", sets: "3 × 20", rest: "30s" },
        { name: "Plank Hold", sets: "3 × 45s", rest: "30s" },
      ]},
      { day: "Friday", name: "HIIT + Abs Finisher", exercises: [
        { name: "Sprints (Treadmill)", sets: "8 × 20s on/40s off", rest: "—" },
        { name: "Medicine Ball Slams", sets: "3 × 15", rest: "30s" },
        { name: "Ab Wheel Rollouts", sets: "3 × 10", rest: "45s" },
        { name: "Flutter Kicks", sets: "3 × 30s", rest: "20s" },
      ]},
      { day: "Saturday", name: "Active Recovery", exercises: [
        { name: "Yoga Flow", sets: "30 min", rest: "—" },
        { name: "Foam Rolling", sets: "15 min", rest: "—" },
        { name: "Light Walk", sets: "20 min", rest: "—" },
      ]},
      { day: "Sunday", name: "Rest Day", exercises: [] },
    ],
  },
  muscle_gain: {
    title: "Muscle Gain Program",
    subtitle: "Build size, strength, and mass with progressive overload",
    icon: "💪",
    weeklySchedule: [
      { day: "Monday", name: "Chest & Triceps", exercises: [
        { name: "Bench Press", sets: "4 × 8-10", rest: "90s" },
        { name: "Incline Dumbbell Press", sets: "4 × 10", rest: "75s" },
        { name: "Cable Flyes", sets: "3 × 12", rest: "60s" },
        { name: "Tricep Dips", sets: "3 × 12", rest: "60s" },
        { name: "Skull Crushers", sets: "3 × 12", rest: "60s" },
      ]},
      { day: "Tuesday", name: "Back & Biceps", exercises: [
        { name: "Barbell Rows", sets: "4 × 8-10", rest: "90s" },
        { name: "Lat Pulldowns", sets: "4 × 10", rest: "75s" },
        { name: "T-Bar Rows", sets: "3 × 10", rest: "75s" },
        { name: "Barbell Curls", sets: "3 × 12", rest: "60s" },
        { name: "Hammer Curls", sets: "3 × 12", rest: "60s" },
      ]},
      { day: "Wednesday", name: "Legs (Quad Focus)", exercises: [
        { name: "Barbell Squats", sets: "4 × 8", rest: "120s" },
        { name: "Leg Press", sets: "4 × 10", rest: "90s" },
        { name: "Leg Extensions", sets: "3 × 15", rest: "60s" },
        { name: "Walking Lunges", sets: "3 × 12/leg", rest: "60s" },
        { name: "Calf Raises", sets: "4 × 15", rest: "45s" },
      ]},
      { day: "Thursday", name: "Shoulders & Arms", exercises: [
        { name: "Overhead Press", sets: "4 × 8", rest: "90s" },
        { name: "Lateral Raises", sets: "4 × 15", rest: "45s" },
        { name: "Face Pulls", sets: "3 × 15", rest: "45s" },
        { name: "EZ Bar Curls", sets: "3 × 10", rest: "60s" },
        { name: "Rope Pushdowns", sets: "3 × 12", rest: "60s" },
      ]},
      { day: "Friday", name: "Legs (Hamstring & Glute Focus)", exercises: [
        { name: "Romanian Deadlifts", sets: "4 × 10", rest: "90s" },
        { name: "Bulgarian Split Squats", sets: "3 × 10/leg", rest: "75s" },
        { name: "Leg Curls", sets: "3 × 12", rest: "60s" },
        { name: "Hip Thrusts", sets: "4 × 12", rest: "75s" },
        { name: "Seated Calf Raises", sets: "4 × 15", rest: "45s" },
      ]},
      { day: "Saturday", name: "Chest & Back (Volume)", exercises: [
        { name: "Dumbbell Bench Press", sets: "4 × 12", rest: "60s" },
        { name: "Pull-Ups", sets: "4 × max", rest: "90s" },
        { name: "Pec Deck", sets: "3 × 15", rest: "45s" },
        { name: "Seated Cable Rows", sets: "3 × 12", rest: "60s" },
      ]},
      { day: "Sunday", name: "Rest Day", exercises: [] },
    ],
  },
  strength_training: {
    title: "Strength Training Program",
    subtitle: "Build raw strength with compound lifts and progressive loading",
    icon: "🏋️",
    weeklySchedule: [
      { day: "Monday", name: "Squat Day", exercises: [
        { name: "Back Squats", sets: "5 × 5", rest: "3min" },
        { name: "Front Squats", sets: "3 × 6", rest: "2min" },
        { name: "Leg Press", sets: "3 × 8", rest: "90s" },
        { name: "Plank Holds", sets: "3 × 60s", rest: "60s" },
      ]},
      { day: "Tuesday", name: "Bench Day", exercises: [
        { name: "Flat Bench Press", sets: "5 × 5", rest: "3min" },
        { name: "Close-Grip Bench", sets: "3 × 8", rest: "2min" },
        { name: "Overhead Tricep Extension", sets: "3 × 10", rest: "90s" },
        { name: "Dumbbell Flyes", sets: "3 × 12", rest: "60s" },
      ]},
      { day: "Wednesday", name: "Active Recovery", exercises: [
        { name: "Light Cardio", sets: "20 min", rest: "—" },
        { name: "Mobility Work", sets: "15 min", rest: "—" },
        { name: "Stretching", sets: "15 min", rest: "—" },
      ]},
      { day: "Thursday", name: "Deadlift Day", exercises: [
        { name: "Conventional Deadlifts", sets: "5 × 5", rest: "3min" },
        { name: "Barbell Rows", sets: "4 × 6", rest: "2min" },
        { name: "Pull-ups (Weighted)", sets: "3 × 6", rest: "2min" },
        { name: "Farmers Walk", sets: "3 × 40m", rest: "90s" },
      ]},
      { day: "Friday", name: "OHP Day", exercises: [
        { name: "Overhead Press", sets: "5 × 5", rest: "3min" },
        { name: "Push Press", sets: "3 × 6", rest: "2min" },
        { name: "Lateral Raises", sets: "4 × 12", rest: "60s" },
        { name: "Shrugs", sets: "3 × 15", rest: "60s" },
      ]},
      { day: "Saturday", name: "Accessory Work", exercises: [
        { name: "Barbell Curls", sets: "4 × 10", rest: "60s" },
        { name: "Dips", sets: "4 × 10", rest: "60s" },
        { name: "Core Circuit", sets: "3 rounds", rest: "60s" },
      ]},
      { day: "Sunday", name: "Rest Day", exercises: [] },
    ],
  },
  general_fitness: {
    title: "General Fitness Program",
    subtitle: "Balanced training for overall health and well-being",
    icon: "🏃",
    weeklySchedule: [
      { day: "Monday", name: "Full Body Strength", exercises: [
        { name: "Goblet Squats", sets: "3 × 12", rest: "60s" },
        { name: "Push-Ups", sets: "3 × 15", rest: "45s" },
        { name: "Dumbbell Rows", sets: "3 × 12", rest: "60s" },
        { name: "Plank", sets: "3 × 45s", rest: "30s" },
        { name: "Lunges", sets: "3 × 10/leg", rest: "45s" },
      ]},
      { day: "Tuesday", name: "Cardio Mix", exercises: [
        { name: "Cycling", sets: "15 min", rest: "—" },
        { name: "Jump Rope", sets: "5 × 2min", rest: "60s" },
        { name: "Elliptical", sets: "15 min", rest: "—" },
      ]},
      { day: "Wednesday", name: "Upper Body + Core", exercises: [
        { name: "Dumbbell Press", sets: "3 × 12", rest: "60s" },
        { name: "Lat Pulldowns", sets: "3 × 12", rest: "60s" },
        { name: "Shoulder Press", sets: "3 × 10", rest: "60s" },
        { name: "Russian Twists", sets: "3 × 20", rest: "30s" },
        { name: "Dead Bugs", sets: "3 × 12", rest: "30s" },
      ]},
      { day: "Thursday", name: "Yoga & Flexibility", exercises: [
        { name: "Sun Salutations", sets: "10 rounds", rest: "—" },
        { name: "Warrior Sequence", sets: "15 min", rest: "—" },
        { name: "Hip Openers", sets: "10 min", rest: "—" },
        { name: "Cool Down Stretch", sets: "10 min", rest: "—" },
      ]},
      { day: "Friday", name: "Lower Body + Cardio", exercises: [
        { name: "Squats", sets: "3 × 12", rest: "60s" },
        { name: "Romanian Deadlifts", sets: "3 × 10", rest: "60s" },
        { name: "Step-Ups", sets: "3 × 10/leg", rest: "45s" },
        { name: "Treadmill Walk (Incline)", sets: "15 min", rest: "—" },
      ]},
      { day: "Saturday", name: "Fun Activity", exercises: [
        { name: "Sports / Swimming / Cycling", sets: "45 min", rest: "—" },
        { name: "Stretching", sets: "15 min", rest: "—" },
      ]},
      { day: "Sunday", name: "Rest Day", exercises: [] },
    ],
  },
  endurance: {
    title: "Endurance Training Program",
    subtitle: "Build stamina, cardiovascular strength, and mental toughness",
    icon: "⚡",
    weeklySchedule: [
      { day: "Monday", name: "Tempo Run + Strength", exercises: [
        { name: "Treadmill Tempo Run", sets: "30 min", rest: "—" },
        { name: "Bodyweight Squats", sets: "3 × 20", rest: "30s" },
        { name: "Push-Ups", sets: "3 × 20", rest: "30s" },
        { name: "Core Plank", sets: "3 × 60s", rest: "30s" },
      ]},
      { day: "Tuesday", name: "Interval Training", exercises: [
        { name: "Cycling Intervals", sets: "10 × 1min fast/1min slow", rest: "—" },
        { name: "Rowing (Hard Pace)", sets: "5 × 500m", rest: "90s" },
        { name: "Box Step-Ups", sets: "3 × 15/leg", rest: "30s" },
      ]},
      { day: "Wednesday", name: "Active Recovery", exercises: [
        { name: "Easy Walk / Jog", sets: "30 min", rest: "—" },
        { name: "Foam Rolling", sets: "15 min", rest: "—" },
        { name: "Light Yoga", sets: "15 min", rest: "—" },
      ]},
      { day: "Thursday", name: "Long Cardio", exercises: [
        { name: "Steady-State Run / Cycle", sets: "45 min", rest: "—" },
        { name: "Cool-Down Walk", sets: "10 min", rest: "—" },
        { name: "Stretching", sets: "10 min", rest: "—" },
      ]},
      { day: "Friday", name: "HIIT & Power", exercises: [
        { name: "Sprints", sets: "8 × 20s", rest: "40s" },
        { name: "Burpees", sets: "4 × 10", rest: "45s" },
        { name: "Kettlebell Swings", sets: "4 × 15", rest: "30s" },
        { name: "Mountain Climbers", sets: "4 × 30s", rest: "20s" },
      ]},
      { day: "Saturday", name: "Long Run / Swim", exercises: [
        { name: "Outdoor Run or Pool Swim", sets: "60 min", rest: "—" },
      ]},
      { day: "Sunday", name: "Rest Day", exercises: [] },
    ],
  },
};

/* ═══════════════════════════════════════════════════════
   DIET PLANS — keyed by fitnessGoal × dietPreference
   ═══════════════════════════════════════════════════════ */
const DIET_PLANS = {
  weight_loss: {
    vegetarian: {
      summary: "Low-calorie, high-fiber vegetarian plan for effective fat loss.",
      calories: "1500 kcal", protein: "80g", water: "3.5L",
      meals: {
        "🍳 Breakfast (7:30 AM)": "Oats with berries, green tea, sprouts salad",
        "🍛 Lunch (1:00 PM)": "Brown rice (small), dal, mixed sabzi, buttermilk, salad",
        "🍎 Snacks (4:30 PM)": "Roasted makhana, green smoothie, cucumber sticks",
        "🌙 Dinner (7:30 PM)": "Soup, grilled paneer tikka, stir-fried veggies, no carbs",
      },
      tips: ["Avoid sugar and refined carbs", "Eat slowly, chew well", "Walk 10K steps daily", "No eating after 8 PM"],
    },
    non_vegetarian: {
      summary: "High-protein, low-carb non-veg plan for maximum fat burning.",
      calories: "1600 kcal", protein: "120g", water: "3.5L",
      meals: {
        "🍳 Breakfast (7:30 AM)": "Egg white omelette (3 eggs) with spinach, whole wheat toast, black coffee",
        "🍛 Lunch (1:00 PM)": "Grilled chicken breast, brown rice (small), salad with olive oil",
        "🍎 Snacks (4:30 PM)": "Boiled eggs (2), almonds, green tea",
        "🌙 Dinner (7:30 PM)": "Grilled fish, steamed broccoli, clear soup, no carbs",
      },
      tips: ["Prioritize lean proteins", "Reduce oil usage", "Avoid fried foods completely", "Meal prep on weekends"],
    },
    vegan: {
      summary: "Plant-based low-calorie plan rich in fiber and natural nutrients.",
      calories: "1400 kcal", protein: "65g", water: "3.5L",
      meals: {
        "🍳 Breakfast (7:30 AM)": "Chia seed pudding with almond milk, fruit bowl, green tea",
        "🍛 Lunch (1:00 PM)": "Quinoa bowl, black beans, avocado, mixed greens",
        "🍎 Snacks (4:30 PM)": "Roasted chickpeas, fruit smoothie, raw veggies",
        "🌙 Dinner (7:30 PM)": "Lentil soup, tofu stir-fry, sautéed vegetables",
      },
      tips: ["Get B12 supplements", "Include nuts and seeds daily", "Combine legumes with grains for complete protein", "Stay hydrated"],
    },
    eggetarian: {
      summary: "Egg-based protein plan for vegetarians targeting fat loss.",
      calories: "1550 kcal", protein: "90g", water: "3.5L",
      meals: {
        "🍳 Breakfast (7:30 AM)": "Scrambled eggs (3) with veggies, multigrain toast, green tea",
        "🍛 Lunch (1:00 PM)": "Egg curry, brown rice (small), dal, large salad",
        "🍎 Snacks (4:30 PM)": "Boiled eggs (2), sprouts chaat, buttermilk",
        "🌙 Dinner (7:30 PM)": "Egg bhurji, roti (1), mixed vegetable soup",
      },
      tips: ["Eggs are your best friend", "Control oil in cooking", "Add veggies to every meal", "Avoid processed snacks"],
    },
  },
  muscle_gain: {
    vegetarian: {
      summary: "High-calorie vegetarian plan for maximum muscle growth.",
      calories: "2800 kcal", protein: "130g", water: "4L",
      meals: {
        "🍳 Breakfast (7:30 AM)": "Paneer paratha (2), banana shake with whey, almonds, dates",
        "🍛 Lunch (1:00 PM)": "Rice, rajma/chole, paneer bhurji, curd, ghee",
        "🍎 Snacks (4:30 PM)": "Peanut butter sandwich, protein shake, dry fruits mix",
        "🌙 Dinner (8:00 PM)": "Roti (3) with ghee, soya chunk curry, dal, sweet curd",
      },
      tips: ["Eat surplus of 500+ calories", "Add ghee and nuts liberally", "Take creatine supplement", "Protein shake post-workout"],
    },
    non_vegetarian: {
      summary: "Classic bodybuilder's non-veg meal plan for serious gains.",
      calories: "3000 kcal", protein: "180g", water: "4L",
      meals: {
        "🍳 Breakfast (7:30 AM)": "6 egg omelette, oats with banana, peanut butter, milk",
        "🍛 Lunch (1:00 PM)": "White rice (large), chicken curry (250g), dal, salad, curd",
        "🍎 Snacks (4:30 PM)": "Chicken wrap, whey protein shake, mixed nuts",
        "🌙 Dinner (8:00 PM)": "Grilled fish/chicken (200g), roti (2) with ghee, paneer sabzi",
      },
      tips: ["Track protein per meal (40-50g)", "Never skip post-workout meal", "Sleep 8+ hours for recovery", "Progressive overload in training"],
    },
    vegan: {
      summary: "Plant-powered mass building plan with complete amino acid profiles.",
      calories: "2600 kcal", protein: "110g", water: "4L",
      meals: {
        "🍳 Breakfast (7:30 AM)": "Tofu scramble, avocado toast (2), soy milk smoothie with banana",
        "🍛 Lunch (1:00 PM)": "Rice and dal (large), soya chunks, mixed veggies, peanut chutney",
        "🍎 Snacks (4:30 PM)": "Tempeh wrap, trail mix, plant protein shake",
        "🌙 Dinner (8:00 PM)": "Chickpea pasta, lentil soup, sweet potato mash, tahini dressing",
      },
      tips: ["Combine rice + dal for complete protein", "Use hemp seeds and chia daily", "Eat calorie-dense foods: avocado, nuts, tahini", "Consider vegan creatine"],
    },
    eggetarian: {
      summary: "Egg-heavy high-protein plan for lean muscle building.",
      calories: "2700 kcal", protein: "150g", water: "4L",
      meals: {
        "🍳 Breakfast (7:30 AM)": "6 egg omelette with cheese, paratha (2), banana shake",
        "🍛 Lunch (1:00 PM)": "Rice, egg curry (4 eggs), paneer sabzi, curd, salad",
        "🍎 Snacks (4:30 PM)": "Egg sandwich, peanut butter, whey shake, almonds",
        "🌙 Dinner (8:00 PM)": "Egg bhurji (4 eggs), roti (2), soya chunk curry, milk",
      },
      tips: ["10+ eggs a day is your target", "Add cheese and ghee for calories", "Post-workout: whey + banana immediately", "Don't skip meals, eat every 3 hours"],
    },
  },
  strength_training: {
    vegetarian: {
      summary: "Calorie-balanced veg plan to support heavy lifting and recovery.",
      calories: "2400 kcal", protein: "110g", water: "3.5L",
      meals: {
        "🍳 Breakfast (7:30 AM)": "Poha with peanuts, whey protein, banana, almonds",
        "🍛 Lunch (1:00 PM)": "Rice, paneer curry, dal fry, ghee, salad",
        "🍎 Snacks (4:30 PM)": "Protein bar, mixed nuts, sweet potato",
        "🌙 Dinner (7:30 PM)": "Multigrain roti (2), chole, palak paneer, curd",
      },
      tips: ["Carbs before lifting, protein after", "Don't train fasted", "Creatine monohydrate daily", "Foam roll and stretch regularly"],
    },
    non_vegetarian: {
      summary: "Performance-focused non-veg diet for peak strength output.",
      calories: "2800 kcal", protein: "160g", water: "4L",
      meals: {
        "🍳 Breakfast (7:30 AM)": "4 eggs + oats + peanut butter + banana + milk",
        "🍛 Lunch (1:00 PM)": "Rice, chicken breast (200g), dal, veggies, curd",
        "🍎 Snacks (4:30 PM)": "Grilled chicken sandwich, whey shake, dates",
        "🌙 Dinner (7:30 PM)": "Fish/mutton (150g), roti (2), dal makhni, salad",
      },
      tips: ["Eat 1.6-2g protein per kg bodyweight", "Pre-workout meal 90 min before", "Complex carbs for sustained energy", "Weekly diet variety prevents boredom"],
    },
    vegan: {
      summary: "Plant-based strength fuel with optimal macro ratios.",
      calories: "2300 kcal", protein: "95g", water: "3.5L",
      meals: {
        "🍳 Breakfast (7:30 AM)": "Smoothie bowl (soy milk, oats, banana, hemp seeds), toast with almond butter",
        "🍛 Lunch (1:00 PM)": "Brown rice, black bean curry, tofu, mixed greens",
        "🍎 Snacks (4:30 PM)": "Edamame, trail mix, plant protein shake",
        "🌙 Dinner (7:30 PM)": "Lentil pasta, tempeh stir-fry, roasted sweet potato",
      },
      tips: ["Leucine-rich foods: soy, lentils", "Zinc and iron supplementation", "Pre-workout: banana + dates", "Consider BCAAs supplement"],
    },
    eggetarian: {
      summary: "Egg-powered nutrition plan for strength athletes.",
      calories: "2500 kcal", protein: "140g", water: "3.5L",
      meals: {
        "🍳 Breakfast (7:30 AM)": "5 egg omelette, toast (2), banana shake, almonds",
        "🍛 Lunch (1:00 PM)": "Rice, egg masala, paneer butter, dal, curd",
        "🍎 Snacks (4:30 PM)": "Boiled eggs (3), peanut butter on crackers, whey",
        "🌙 Dinner (7:30 PM)": "Egg fried rice (healthy), mixed sabzi, soup",
      },
      tips: ["Front-load protein at breakfast", "Casein protein before bed", "Complex carbs 2 hours pre-workout", "Rest day calories same as training day"],
    },
  },
  general_fitness: {
    vegetarian: {
      summary: "Balanced and sustainable vegetarian diet for overall wellness.",
      calories: "2000 kcal", protein: "80g", water: "3L",
      meals: {
        "🍳 Breakfast (8:00 AM)": "Upma/poha with veggies, fruit, green tea",
        "🍛 Lunch (1:00 PM)": "Balanced thali — roti, dal, sabzi, salad, curd",
        "🍎 Snacks (4:30 PM)": "Sprouts chaat, almonds, buttermilk",
        "🌙 Dinner (7:30 PM)": "Multigrain roti, light sabzi, soup, fruit",
      },
      tips: ["Eat seasonal and local produce", "Maintain regular meal timings", "Avoid processed and packaged food", "30 min walk after dinner"],
    },
    non_vegetarian: {
      summary: "Wholesome non-veg diet promoting balanced nutrition and energy.",
      calories: "2200 kcal", protein: "100g", water: "3L",
      meals: {
        "🍳 Breakfast (8:00 AM)": "2 boiled eggs, toast, fruit bowl, green tea",
        "🍛 Lunch (1:00 PM)": "Rice, chicken curry (150g), dal, salad, curd",
        "🍎 Snacks (4:30 PM)": "Egg sandwich, fruits, mixed nuts",
        "🌙 Dinner (7:30 PM)": "Grilled fish/chicken, roti (1), light soup, vegetables",
      },
      tips: ["Variety is key — rotate proteins weekly", "Eat the rainbow (colorful veggies)", "Limit red meat to once a week", "Stay consistent with portions"],
    },
    vegan: {
      summary: "Nutrient-complete vegan plan for everyday vitality.",
      calories: "1800 kcal", protein: "65g", water: "3L",
      meals: {
        "🍳 Breakfast (8:00 AM)": "Smoothie (banana, spinach, soy milk, chia), whole wheat toast",
        "🍛 Lunch (1:00 PM)": "Rice, rajma/chana, stir-fried tofu, large salad",
        "🍎 Snacks (4:30 PM)": "Fruit bowl, roasted chickpeas, herbal tea",
        "🌙 Dinner (7:30 PM)": "Vegetable khichdi, lentil soup, steamed veggies",
      },
      tips: ["B12 supplement is essential", "Iron-rich foods: spinach, dates, jaggery", "Include omega-3 via flax/walnuts", "Eat fermented foods for gut health"],
    },
    eggetarian: {
      summary: "Well-rounded egg + veg diet for daily health and energy.",
      calories: "2000 kcal", protein: "90g", water: "3L",
      meals: {
        "🍳 Breakfast (8:00 AM)": "Egg dosa/cheela (2), chutney, fruit, tea",
        "🍛 Lunch (1:00 PM)": "Rice, egg curry, sabzi, dal, salad, curd",
        "🍎 Snacks (4:30 PM)": "Boiled eggs, sprouts, buttermilk",
        "🌙 Dinner (7:30 PM)": "Roti (2), paneer/egg bhurji, light soup",
      },
      tips: ["3 meals + 2 snacks daily", "Don't skip breakfast", "Hydrate throughout the day", "Mindful eating — no screens at meals"],
    },
  },
  endurance: {
    vegetarian: {
      summary: "Carb-rich vegetarian plan to fuel long training sessions.",
      calories: "2400 kcal", protein: "85g", water: "4L",
      meals: {
        "🍳 Breakfast (7:00 AM)": "Banana pancakes, peanut butter, honey, milk",
        "🍛 Lunch (12:30 PM)": "White rice (large), rajma, paneer, curd, salad",
        "🍎 Snacks (4:00 PM)": "Energy bars, dried fruits, electrolyte drink",
        "🌙 Dinner (7:30 PM)": "Pasta with olive oil sauce, bread, light soup",
      },
      tips: ["Carb-load before long sessions", "Electrolytes during workouts > 1hr", "Recovery meal within 30 min post-workout", "Don't fear carbs — they're your fuel"],
    },
    non_vegetarian: {
      summary: "Athlete's non-veg plan with optimal carb-to-protein ratios for stamina.",
      calories: "2600 kcal", protein: "120g", water: "4L",
      meals: {
        "🍳 Breakfast (7:00 AM)": "3 eggs, oats, banana, orange juice, toast",
        "🍛 Lunch (12:30 PM)": "Rice, chicken (200g), dal, veggies, curd",
        "🍎 Snacks (4:00 PM)": "Turkey/chicken wrap, sports drink, energy bar",
        "🌙 Dinner (7:30 PM)": "Grilled salmon/tuna, sweet potato, steamed veggies",
      },
      tips: ["60% calories from carbs for endurance", "Hydrate with electrolytes", "Caffeine 30 min before session for performance", "Recovery protein within 30 min"],
    },
    vegan: {
      summary: "Plant-based endurance fuel for sustained cardio performance.",
      calories: "2200 kcal", protein: "70g", water: "4L",
      meals: {
        "🍳 Breakfast (7:00 AM)": "Oat smoothie (banana, dates, soy milk, flax), toast",
        "🍛 Lunch (12:30 PM)": "Rice, lentil dal, tofu, roasted sweet potato, salad",
        "🍎 Snacks (4:00 PM)": "Dates and nuts, coconut water, energy balls",
        "🌙 Dinner (7:30 PM)": "Quinoa stir-fry, bean soup, steamed broccoli",
      },
      tips: ["Beet juice improves endurance by 3%", "Simple sugars during long sessions", "Omega-3 from walnuts and flax", "Sleep is your best recovery tool"],
    },
    eggetarian: {
      summary: "Egg-powered endurance plan with balanced carbs and protein.",
      calories: "2400 kcal", protein: "100g", water: "4L",
      meals: {
        "🍳 Breakfast (7:00 AM)": "4 egg French toast, honey, banana shake, almonds",
        "🍛 Lunch (12:30 PM)": "Rice, egg curry (3 eggs), dal, curd, salad",
        "🍎 Snacks (4:00 PM)": "Boiled eggs (2), peanut butter crackers, sports drink",
        "🌙 Dinner (7:30 PM)": "Egg fried noodles (healthy), mixed vegetable soup",
      },
      tips: ["Eggs are perfect recovery food", "Complex carbs 2hrs before cardio", "Simple carbs during session > 1hr", "Stretching post-workout prevents injury"],
    },
  },
};

/* ═══════════════════════════════════════════════════════
   GOAL LABEL HELPERS
   ═══════════════════════════════════════════════════════ */
const GOAL_LABELS = {
  weight_loss: "Weight Loss",
  muscle_gain: "Muscle Gain",
  strength_training: "Strength Training",
  general_fitness: "General Fitness",
  endurance: "Endurance",
};
const LEVEL_LABELS = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};
const FOCUS_LABELS = {
  full_body: "Full Body",
  upper_body: "Upper Body",
  lower_body: "Lower Body",
  core: "Core & Abs",
  cardio: "Cardio Focus",
};
const DIET_LABELS = {
  vegetarian: "Vegetarian",
  non_vegetarian: "Non-Vegetarian",
  vegan: "Vegan",
  eggetarian: "Eggetarian",
};

/* ═══════════════════════════════════════════════════════
   FOR MEMBERS COMPONENT
   ═══════════════════════════════════════════════════════ */
const ForMembers = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading, logout } = useAuth();

  // ── Membership state ─────────────────────────────
  const [membership, setMembership] = useState(null);
  const [membershipLoading, setMembershipLoading] = useState(true);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlanName, setSelectedPlanName] = useState("Quarterly");
  const [planDiscountMap, setPlanDiscountMap] = useState({});

  // ── Fetch active discounts on mount ───────────────────
  useEffect(() => {
    getActiveDiscounts()
      .then((res) => {
        const data = res.data?.data;
        if (data?.planDiscountMap) {
          setPlanDiscountMap(data.planDiscountMap);
        }
      })
      .catch((err) => {
        console.warn("Could not load active discounts in ForMembers:", err);
      });
  }, []);

  // ── Fetch membership on mount ──────────────────────
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      getMyMembership()
        .then((res) => {
          const data = res.data?.data;
          if (data && data.planName) {
            setMembership(data);
          } else {
            setMembership(null);
          }
        })
        .catch(() => {
          setMembership(null);
        })
        .finally(() => setMembershipLoading(false));
    } else if (!authLoading) {
      setMembership(null);
      setMembershipLoading(false);
    }
  }, [isAuthenticated, authLoading]);

  // ── Dynamic Member Name Resolution ───────────────────
  const memberInfo = useMemo(() => {
    let stored = {};
    try {
      stored = JSON.parse(localStorage.getItem("fittrack_member") || "{}");
    } catch {
      stored = {};
    }

    const raw =
      searchParams.get("name") ||
      searchParams.get("username") ||
      location.state?.name ||
      location.state?.user?.firstName ||
      stored.firstName ||
      stored.name ||
      stored.username ||
      "Member";

    const cleanName = raw.charAt(0).toUpperCase() + raw.slice(1);
    const username = location.state?.username || stored.username || raw.toLowerCase().replace(/\s+/g, "_");
    const email = location.state?.email || stored.email || `${username}@fittrack.com`;
    const role = location.state?.role || stored.role || "MEMBER";

    return { name: cleanName, username, email, role };
  }, [searchParams, location]);

  // ── Interactive Phone State ──────────────────────────
  const [phoneTab, setPhoneTab] = useState("today");
  const [isCheckedIn, setIsCheckedIn] = useState(true);
  const [checkInTime] = useState("01:52 PM");
  const [completedExercises, setCompletedExercises] = useState({
    1: true,
    2: false,
    3: false,
    4: false,
  });

  const toggleExercise = (id) => {
    setCompletedExercises((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCheckIn = () => {
    setIsCheckedIn(!isCheckedIn);
  };

  const handleSignOut = () => {
    logout();
    navigate("/");
  };

  // ── BMI Calculator State ────────────────────────────
  const [bmiForm, setBmiForm] = useState({ height: "", weight: "" });
  const [bmiResult, setBmiResult] = useState(null);
  const [selectedDay, setSelectedDay] = useState(0);

  const calculateBMI = () => {
    const h = parseFloat(bmiForm.height);
    const w = parseFloat(bmiForm.weight);
    if (!h || !w || h <= 0 || w <= 0) return;

    const heightInM = h / 100;
    const bmi = w / (heightInM * heightInM);
    const rounded = Math.round(bmi * 10) / 10;

    let category, cssClass, gaugePercent;
    if (rounded < 18.5) {
      category = "Underweight";
      cssClass = "bmi-underweight";
      gaugePercent = Math.max(10, (rounded / 18.5) * 25);
    } else if (rounded < 25) {
      category = "Normal";
      cssClass = "bmi-normal";
      gaugePercent = 25 + ((rounded - 18.5) / 6.5) * 25;
    } else if (rounded < 30) {
      category = "Overweight";
      cssClass = "bmi-overweight";
      gaugePercent = 50 + ((rounded - 25) / 5) * 25;
    } else {
      category = "Obese";
      cssClass = "bmi-obese";
      gaugePercent = Math.min(95, 75 + ((rounded - 30) / 10) * 25);
    }

    setBmiResult({ value: rounded, category, cssClass, gaugePercent });
  };

  // ── Resolve training & diet plan from membership ────
  const fitnessGoal = membership?.fitnessGoal || "general_fitness";
  const dietPref = membership?.dietPreference || "vegetarian";
  const trainingPlan = TRAINING_PLANS[fitnessGoal] || TRAINING_PLANS.general_fitness;
  const dietPlan = DIET_PLANS[fitnessGoal]?.[dietPref] || DIET_PLANS.general_fitness.vegetarian;

  // ── Loading State ──────────────────────────────────
  if (membershipLoading) {
    return (
      <div className="fm-page">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
          <div className="fm-loading-spinner" />
        </div>
      </div>
    );
  }

  // ── NO MEMBERSHIP — LOCKED STATE ──────────────────
  if (!membership) {
    return (
      <div className="fm-page">
        <header className="fm-header">
          <div className="fm-container fm-header-inner">
            <Link to="/" className="fm-brand">
              <div className="fm-brand-icon">
                <IoFitnessOutline />
              </div>
              <span className="fm-brand-name">FitTrack</span>
            </Link>
            <nav className="fm-nav">
              <Link to="/">Home</Link>
              <Link to="/for-members" className="active">For Members</Link>
            </nav>
            <div className="fm-header-user">
              <ThemeToggle className="fm-theme-toggle" />
              {isAuthenticated ? (
                <Link to="/" className="fm-phone-signout" style={{ textDecoration: "none" }}>
                  Go to Plans
                </Link>
              ) : (
                <Link to="/login" className="fm-phone-signout" style={{ textDecoration: "none" }}>
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </header>

        <section className="fm-locked-section">
          <div className="fm-locked-glow" />
          <div className="fm-container fm-locked-content">
            <div className="fm-locked-icon">
              <HiOutlineLockClosed />
            </div>
            <h1 className="fm-locked-title">
              Member Area <span className="highlight">Locked</span>
            </h1>
            <p className="fm-locked-desc">
              This section is exclusively for FitTrack members with an active membership plan.
              Purchase a plan to unlock your personalized training schedule, diet charts,
              workout tracking, and more.
            </p>
            <div className="fm-locked-features">
              <div className="fm-locked-feature">
                <HiOutlineBolt />
                <span>Personalized Training Plans</span>
              </div>
              <div className="fm-locked-feature">
                <HiOutlineClipboardDocumentList />
                <span>Custom Diet Charts</span>
              </div>
              <div className="fm-locked-feature">
                <HiOutlineCalendarDays />
                <span>Workout Tracking</span>
              </div>
              <div className="fm-locked-feature">
                <HiOutlineScale />
                <span>BMI & Progress Analytics</span>
              </div>
            </div>
            {/* Membership Plans Grid */}
            <div className="fm-locked-plans-wrap">
              <h3 className="fm-locked-plans-title">Choose a Membership Plan</h3>
              <p className="fm-locked-plans-sub">
                Select your plan below, complete simulated payment, and unlock your member portal instantly.
              </p>

              <div className="fm-locked-plans-grid">
                {[
                  { name: "Monthly", price: 1500, per: "/ month", desc: "Full gym & class access" },
                  { name: "Quarterly", price: 4000, per: "/ 3 months", desc: "Trainer-led workouts & diet", featured: true, badge: "Most Popular" },
                  { name: "Half Yearly", price: 7500, per: "/ 6 months", desc: "Advanced tracking & perks", badge: "Save 20%" },
                  { name: "Annual", price: 14000, per: "/ year", desc: "All-inclusive VIP access", badge: "Best Value" },
                ].map((plan) => {
                  const discount = planDiscountMap[plan.name];
                  const hasDiscount = Boolean(discount);
                  const origPrice = plan.price;
                  const discountPct = discount?.discountPercentage || 0;
                  const finalPrice = discount?.discountedPrice ?? (origPrice - Math.round((origPrice * discountPct) / 100));

                  return (
                    <div key={plan.name} className={`fm-locked-plan-card ${plan.featured ? "featured" : ""}`}>
                      {hasDiscount ? (
                        <span className="fm-locked-badge discount">🔥 {discountPct}% OFF</span>
                      ) : plan.badge ? (
                        <span className="fm-locked-badge">{plan.badge}</span>
                      ) : null}

                      <div>
                        <h4 className="fm-locked-plan-name">{plan.name}</h4>
                        <p className="fm-locked-plan-desc">{plan.desc}</p>
                      </div>

                      <div className="fm-locked-price-wrap">
                        {hasDiscount && (
                          <span className="fm-locked-old-price">₹{origPrice.toLocaleString("en-IN")}</span>
                        )}
                        <p className="fm-locked-price">
                          ₹{finalPrice.toLocaleString("en-IN")}
                          <small>{plan.per}</small>
                        </p>
                      </div>

                      <button
                        type="button"
                        className="fm-locked-buy-btn"
                        onClick={() => {
                          if (!isAuthenticated) {
                            navigate("/login");
                            return;
                          }
                          setSelectedPlanName(plan.name);
                          setShowCheckoutModal(true);
                        }}
                      >
                        <span>{hasDiscount ? `Buy (${discountPct}% OFF)` : "Buy Membership Plan"}</span>
                        <HiOutlineArrowRight />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="fm-locked-cta" style={{ marginTop: 28 }}>
              <Link to={isAuthenticated ? "/#plans" : "/login"} className="fm-locked-btn primary">
                {isAuthenticated ? "Browse Plans on Home" : "Sign In & Get Started"}
                <HiOutlineArrowRight />
              </Link>
              {!isAuthenticated && (
                <Link to="/register" className="fm-locked-btn ghost">
                  Create Account
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* ── CHECKOUT & PAYMENT MODAL ────────────────── */}
        <CheckoutModal
          isOpen={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          planName={selectedPlanName}
          discount={planDiscountMap[selectedPlanName]}
          onSuccess={(enrolled) => {
            setMembership(enrolled);
          }}
        />

        <footer className="fm-footer">
          <div className="fm-container">
            <div className="fm-footer-links">
              <Link to="/">Home</Link>
              <Link to="/for-members">For Members</Link>
              <Link to="/register">Register</Link>
              <Link to="/login">Sign In</Link>
            </div>
            <p>© 2026 FitTrack. Connected fitness for training, progress, and membership.</p>
          </div>
        </footer>
      </div>
    );
  }

  // ── HAS MEMBERSHIP — FULL MEMBER DASHBOARD ────────
  return (
    <div className="fm-page">
      {/* ── HEADER / NAVIGATION ────────────────────────── */}
      <header className="fm-header">
        <div className="fm-container fm-header-inner">
          <Link to="/" className="fm-brand">
            <div className="fm-brand-icon">
              <IoFitnessOutline />
            </div>
            <span className="fm-brand-name">FitTrack</span>
          </Link>

          <nav className="fm-nav">
            <Link to="/">Home</Link>
            <Link to="/for-members" className="active">For Members</Link>
            <a href="#training">Training</a>
            <a href="#diet">Diet Plan</a>
            <a href="#bmi">BMI</a>
          </nav>

          <div className="fm-header-user">
            <ThemeToggle className="fm-theme-toggle" />
            <div className="fm-user-chip">
              <span className="fm-user-chip-dot" />
              <span>Hi, {memberInfo.name}</span>
            </div>
            <button type="button" className="fm-phone-signout" onClick={handleSignOut}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION WITH PHONE MOCKUP ─────────────── */}
      <section className="fm-hero">
        <div className="fm-hero-glow" />

        <div className="fm-container fm-hero-split">
          <div className="fm-hero-left">
            <div className="fm-eyebrow">
              <HiOutlineSparkles /> Active Member
            </div>
            <h1>
              Welcome Back, <br />
              <span className="highlight">{memberInfo.name}.</span>
            </h1>
            <p className="fm-hero-lede">
              Your <strong>{GOAL_LABELS[fitnessGoal]}</strong> training plan is ready.
              Your weekly schedule, daily workouts, and personalized diet chart are all below.
              Let's make today count.
            </p>

            <div className="fm-hero-highlights">
              <div className="fm-highlight-item">
                <div className="fm-highlight-icon"><HiOutlineCheck /></div>
                <span><strong>{membership.planName} Plan</strong> — Active until {new Date(membership.endDate).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</span>
              </div>
              <div className="fm-highlight-item">
                <div className="fm-highlight-icon"><HiOutlineCheck /></div>
                <span><strong>Goal:</strong> {GOAL_LABELS[fitnessGoal]} · <strong>Level:</strong> {LEVEL_LABELS[membership?.fitnessLevel] || "Beginner"} · <strong>Focus:</strong> {FOCUS_LABELS[membership?.bodyFocus] || "Full Body"}</span>
              </div>
              <div className="fm-highlight-item">
                <div className="fm-highlight-icon"><HiOutlineCheck /></div>
                <span><strong>Diet:</strong> {DIET_LABELS[dietPref]} · <strong>{dietPlan.calories}</strong> daily · <strong>{dietPlan.protein}</strong> protein</span>
              </div>
            </div>
          </div>

          {/* ── INTERACTIVE PHONE MOCKUP ───────────────── */}
          <div className="fm-phone-shot">
            <div className="fm-phone">
              <div className="fm-phone-screen">
                <div className="fm-phone-status">
                  <span>1:52</span>
                  <div className="fm-phone-status-icons">
                    <span className="bar" />
                    <span className="bar" />
                    <span className="bar" />
                    <span className="bat" />
                  </div>
                </div>

                <div className="fm-phone-app">
                  <div className="fm-phone-header-row">
                    <span className="fm-phone-title">Hi {memberInfo.name}</span>
                    <button type="button" className="fm-phone-signout" onClick={handleSignOut}>
                      Sign out
                    </button>
                  </div>

                  <div className="fm-phone-checkin-card">
                    <div className="fm-phone-checkin-top">
                      <span className="fm-phone-label">FitTrack Elite · Downtown</span>
                      <span style={{ fontSize: 10, color: isCheckedIn ? "var(--fm-emerald)" : "var(--fm-muted)" }}>
                        {isCheckedIn ? "● Live Session" : "○ Inactive"}
                      </span>
                    </div>
                    <div className="fm-phone-body">
                      {isCheckedIn ? `Checked in since ${checkInTime}` : "Not checked in right now"}
                    </div>
                    <button
                      type="button"
                      className={`fm-phone-checkout-btn ${!isCheckedIn ? "checked-out" : ""}`}
                      onClick={toggleCheckIn}
                    >
                      {isCheckedIn ? "Check out" : "Tap to check in"}
                    </button>
                  </div>

                  {phoneTab === "today" && (
                    <>
                      <span className="fm-phone-section-label">Today's workout — {trainingPlan.title}</span>
                      <div className="fm-phone-card">
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                          <span style={{ fontWeight: 700, color: "#fff" }}>{trainingPlan.weeklySchedule[0]?.name}</span>
                          <span className="fm-phone-pill accent">{GOAL_LABELS[fitnessGoal]}</span>
                        </div>

                        {trainingPlan.weeklySchedule[0]?.exercises.slice(0, 4).map((ex, i) => (
                          <div
                            key={i}
                            className={`fm-phone-workout-item ${completedExercises[i + 1] ? "done" : ""}`}
                            onClick={() => toggleExercise(i + 1)}
                          >
                            <div>
                              <div className="fm-phone-workout-name">{i + 1}. {ex.name}</div>
                              <div className="fm-phone-workout-sub">{ex.sets} · Rest {ex.rest}</div>
                            </div>
                            <div className="fm-phone-workout-check">
                              {completedExercises[i + 1] && "✓"}
                            </div>
                          </div>
                        ))}
                      </div>

                      <span className="fm-phone-section-label">Diet plan</span>
                      <div className="fm-phone-card">
                        <div className="fm-phone-pills-row">
                          <span className="fm-phone-pill accent">{dietPlan.calories}</span>
                          <span className="fm-phone-pill amber">{dietPlan.protein}</span>
                          <span className="fm-phone-pill">{dietPlan.water}</span>
                        </div>
                        {Object.entries(dietPlan.meals).slice(0, 3).map(([meal, desc]) => (
                          <div key={meal} className="fm-phone-meal-row">
                            <span style={{ color: "#fff" }}>{meal.split(")")[0]})</span>
                            <span style={{ color: "var(--fm-muted)", fontSize: 11 }}>{desc.split(",")[0]}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {phoneTab === "visits" && (
                    <>
                      <span className="fm-phone-section-label">Attendance & Streak</span>
                      <div className="fm-phone-card">
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: 18, fontWeight: 800, color: "var(--fm-emerald)" }}>12 Days</div>
                            <div style={{ fontSize: 11, color: "var(--fm-muted)" }}>Current Consistency Streak</div>
                          </div>
                          <span className="fm-phone-pill accent">Top 10%</span>
                        </div>
                      </div>
                      <span className="fm-phone-section-label">Recent Sessions</span>
                      <div className="fm-phone-card">
                        <div className="fm-phone-meal-row">
                          <div>
                            <div style={{ color: "#fff", fontWeight: 600 }}>Today (Live)</div>
                            <div style={{ fontSize: 10, color: "var(--fm-muted)" }}>{trainingPlan.weeklySchedule[0]?.name}</div>
                          </div>
                          <span className="fm-phone-pill" style={{ color: "var(--fm-emerald)" }}>In Progress</span>
                        </div>
                      </div>
                    </>
                  )}

                  {phoneTab === "membership" && (
                    <>
                      <span className="fm-phone-section-label">Digital Member Pass</span>
                      <div className="fm-phone-card" style={{ background: "linear-gradient(135deg, rgba(108, 99, 255, 0.25), rgba(6, 182, 212, 0.15))" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: "var(--fm-accent-light)", textTransform: "uppercase" }}>
                            FitTrack {membership.planName}
                          </span>
                          <span className="fm-phone-pill" style={{ background: "var(--fm-emerald)", color: "#fff" }}>ACTIVE</span>
                        </div>
                        <div style={{ marginTop: 8 }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{memberInfo.name}</div>
                          <div style={{ fontSize: 11, color: "var(--fm-muted)" }}>@{memberInfo.username}</div>
                        </div>
                        <div style={{ fontSize: 11, color: "#CBD5E1", marginTop: 4, display: "flex", justifyContent: "space-between" }}>
                          <span>Valid thru: {new Date(membership.endDate).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                          <span>ID: FT-{(memberInfo.username || "MEM").toUpperCase().slice(0, 6)}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {phoneTab === "alerts" && (
                    <>
                      <span className="fm-phone-section-label">Notifications</span>
                      <div className="fm-phone-card">
                        <div style={{ borderLeft: "2px solid var(--fm-accent)", paddingLeft: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Training Plan Active</div>
                          <div style={{ fontSize: 11, color: "var(--fm-muted)", marginTop: 2 }}>
                            Your {GOAL_LABELS[fitnessGoal]} program has been activated.
                          </div>
                        </div>
                      </div>
                      <div className="fm-phone-card">
                        <div style={{ borderLeft: "2px solid var(--fm-emerald)", paddingLeft: 8 }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Diet Plan Ready</div>
                          <div style={{ fontSize: 11, color: "var(--fm-muted)", marginTop: 2 }}>
                            Your {DIET_LABELS[dietPref]} diet plan ({dietPlan.calories}) is set.
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="fm-phone-tabs">
                  <button type="button" className={`fm-phone-tab ${phoneTab === "today" ? "active" : ""}`} onClick={() => setPhoneTab("today")}>
                    <HiOutlineBolt size={14} /><span>Today</span>
                  </button>
                  <button type="button" className={`fm-phone-tab ${phoneTab === "visits" ? "active" : ""}`} onClick={() => setPhoneTab("visits")}>
                    <HiOutlineCalendarDays size={14} /><span>Visits</span>
                  </button>
                  <button type="button" className={`fm-phone-tab ${phoneTab === "membership" ? "active" : ""}`} onClick={() => setPhoneTab("membership")}>
                    <HiOutlineCreditCard size={14} /><span>Member</span>
                  </button>
                  <button type="button" className={`fm-phone-tab ${phoneTab === "alerts" ? "active" : ""}`} onClick={() => setPhoneTab("alerts")}>
                    <HiOutlineBell size={14} /><span>Alerts</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WEEKLY TRAINING PLAN ───────────────────────── */}
      <section className="fm-training-section" id="training">
        <div className="fm-container">
          <div className="fm-section-badge">
            <HiOutlineBolt /> {trainingPlan.icon} Your Training Plan
          </div>
          <h2 className="fm-section-heading">
            <span className="fm-highlight">{trainingPlan.title}</span>
          </h2>
          <p className="fm-section-lede">{trainingPlan.subtitle}</p>

          {/* Day Selector Tabs */}
          <div className="fm-day-tabs">
            {trainingPlan.weeklySchedule.map((day, i) => (
              <button
                key={day.day}
                type="button"
                className={`fm-day-tab ${selectedDay === i ? "active" : ""}`}
                onClick={() => setSelectedDay(i)}
              >
                <span className="fm-day-tab-day">{day.day.slice(0, 3)}</span>
                <span className="fm-day-tab-name">{day.name.length > 16 ? day.name.slice(0, 14) + "…" : day.name}</span>
              </button>
            ))}
          </div>

          {/* Selected Day Workout */}
          {trainingPlan.weeklySchedule[selectedDay] && (
            <div className="fm-workout-day-card">
              <div className="fm-workout-day-header">
                <div>
                  <h3>{trainingPlan.weeklySchedule[selectedDay].day}</h3>
                  <span className="fm-workout-day-type">{trainingPlan.weeklySchedule[selectedDay].name}</span>
                </div>
                <div className="fm-workout-day-pills">
                  <span className="fm-phone-pill accent">{GOAL_LABELS[fitnessGoal]}</span>
                  <span className="fm-phone-pill">{LEVEL_LABELS[membership?.fitnessLevel] || "Beginner"}</span>
                </div>
              </div>

              {trainingPlan.weeklySchedule[selectedDay].exercises.length > 0 ? (
                <div className="fm-exercises-grid">
                  {trainingPlan.weeklySchedule[selectedDay].exercises.map((ex, i) => (
                    <div key={i} className="fm-exercise-card">
                      <div className="fm-exercise-num">{String(i + 1).padStart(2, "0")}</div>
                      <div className="fm-exercise-info">
                        <h4>{ex.name}</h4>
                        <div className="fm-exercise-meta">
                          <span>{ex.sets}</span>
                          {ex.rest !== "—" && <span>Rest: {ex.rest}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="fm-rest-day-card">
                  <span className="fm-rest-icon">🧘</span>
                  <h4>Rest & Recovery Day</h4>
                  <p>Your body grows during rest. Sleep well, stay hydrated, do light stretching.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── PERSONALIZED DIET PLAN ──────────────────────── */}
      <section className="fm-diet-section" id="diet">
        <div className="fm-container">
          <div className="fm-section-badge">
            <HiOutlineClipboardDocumentList /> 🍽️ Your Diet Plan
          </div>
          <h2 className="fm-section-heading">
            <span className="fm-highlight">{DIET_LABELS[dietPref]} Diet</span> for {GOAL_LABELS[fitnessGoal]}
          </h2>
          <p className="fm-section-lede">{dietPlan.summary}</p>

          {/* Macro Pills */}
          <div className="fm-macro-row">
            <div className="fm-macro-card">
              <span className="fm-macro-label">Daily Calories</span>
              <span className="fm-macro-value">{dietPlan.calories}</span>
            </div>
            <div className="fm-macro-card">
              <span className="fm-macro-label">Protein Target</span>
              <span className="fm-macro-value">{dietPlan.protein}</span>
            </div>
            <div className="fm-macro-card">
              <span className="fm-macro-label">Water Intake</span>
              <span className="fm-macro-value">{dietPlan.water}</span>
            </div>
          </div>

          {/* Meal Cards */}
          <div className="fm-diet-meals-grid">
            {Object.entries(dietPlan.meals).map(([meal, desc]) => (
              <div key={meal} className="fm-diet-meal-card">
                <h4 className="fm-diet-meal-name">{meal}</h4>
                <p className="fm-diet-meal-desc">{desc}</p>
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="fm-diet-tips">
            <h4>💡 Pro Tips for {GOAL_LABELS[fitnessGoal]}</h4>
            <ul>
              {dietPlan.tips.map((tip) => (
                <li key={tip}>
                  <HiOutlineCheck className="fm-diet-check" /> {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── BMI CALCULATOR SECTION ───────────────────── */}
      <section className="fm-section fm-bmi-section" id="bmi">
        <div className="fm-container">
          <div className="fm-section-badge">
            <HiOutlineScale /> BMI & Diet Tracker
          </div>
          <h2 className="fm-section-heading">
            Know Your <span className="fm-highlight">Body Mass Index</span>
          </h2>
          <p className="fm-section-lede">
            Enter your height and weight to calculate your BMI and get a
            personalized diet chart tailored to your fitness goals.
          </p>

          <div className="fm-bmi-calculator">
            <div className="fm-bmi-inputs">
              <div className="fm-bmi-field">
                <label htmlFor="bmi-height">Height (cm)</label>
                <input
                  id="bmi-height"
                  type="number"
                  placeholder="e.g. 175"
                  min="50"
                  max="250"
                  value={bmiForm.height}
                  onChange={(e) =>
                    setBmiForm({ ...bmiForm, height: e.target.value })
                  }
                />
              </div>
              <div className="fm-bmi-field">
                <label htmlFor="bmi-weight">Weight (kg)</label>
                <input
                  id="bmi-weight"
                  type="number"
                  placeholder="e.g. 72"
                  min="10"
                  max="300"
                  value={bmiForm.weight}
                  onChange={(e) =>
                    setBmiForm({ ...bmiForm, weight: e.target.value })
                  }
                />
              </div>
              <button
                type="button"
                className="fm-bmi-btn"
                onClick={calculateBMI}
                disabled={!bmiForm.height || !bmiForm.weight}
              >
                <HiOutlineBeaker /> Calculate BMI
              </button>
            </div>

            {bmiResult && (
              <div className="fm-bmi-result-area">
                <div className="fm-bmi-gauge-card">
                  <div className="fm-bmi-gauge-wrapper">
                    <div className="fm-bmi-gauge-track">
                      <div
                        className={`fm-bmi-gauge-fill ${bmiResult.cssClass}`}
                        style={{ width: `${bmiResult.gaugePercent}%` }}
                      />
                      <div
                        className="fm-bmi-gauge-indicator"
                        style={{ left: `${bmiResult.gaugePercent}%` }}
                      />
                    </div>
                    <div className="fm-bmi-gauge-labels">
                      <span>Underweight</span>
                      <span>Normal</span>
                      <span>Overweight</span>
                      <span>Obese</span>
                    </div>
                  </div>
                  <div className="fm-bmi-score">
                    <span className={`fm-bmi-value ${bmiResult.cssClass}`}>
                      {bmiResult.value}
                    </span>
                    <span className={`fm-bmi-category ${bmiResult.cssClass}`}>
                      {bmiResult.category}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────── */}
      <footer className="fm-footer">
        <div className="fm-container">
          <div className="fm-footer-links">
            <Link to="/">Home</Link>
            <Link to="/for-members">For Members</Link>
            <Link to="/register">Register</Link>
            <Link to="/login">Sign In</Link>
          </div>
          <p>© 2026 FitTrack. Connected fitness for training, progress, and membership.</p>
        </div>
      </footer>
    </div>
  );
};

export default ForMembers;
