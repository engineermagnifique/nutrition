import React from 'react';

const testimonialsStyles = `
  .ts-inner {
    max-width: 1060px;
    margin: 0 auto;
    padding: 0 32px;
  }
  .ts-heading {
    font-size: 34px;
  }
  .ts-sub {
    font-size: 16px;
  }
  .ts-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 20px;
  }
  .ts-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 16px;
    margin-top: 40px;
  }

  @media (max-width: 900px) {
    .ts-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .ts-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  @media (max-width: 580px) {
    .ts-inner {
      padding: 0 16px;
    }
    .ts-heading {
      font-size: 26px;
    }
    .ts-sub {
      font-size: 14px;
    }
    .ts-grid {
      grid-template-columns: 1fr;
    }
    .ts-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }
  }
`;

const testimonials = [
  {
    name: "Dr. Amara Diallo",
    title: "Medical Director, Kigali Care Home",
    body: "NutritionX AI transformed how we manage our 120 residents' nutrition. The AI recommendations are remarkably accurate, and our staff saves hours every week on manual tracking.",
    rating: 5,
    initials: "AD",
    avatarBg: "#EAF3DE",
    avatarColor: "#27500A",
    quoteColor: "#EAF3DE",
  },
  {
    name: "Nurse Grace Uwimana",
    title: "Head Caregiver, Sunrise Elderly Center",
    body: "The alert system caught a critical nutritional deficiency in one of our residents before it became serious. This platform is genuinely life-saving. I recommend it to every care institution.",
    rating: 5,
    initials: "GU",
    avatarBg: "#E6F1FB",
    avatarColor: "#0C447C",
    quoteColor: "#E6F1FB",
  },
  {
    name: "Mr. Jean-Pierre Habimana",
    title: "Elderly Resident, 78 years",
    body: "My caregivers use NutritionX AI to plan my meals, and I have felt so much better in the past six months. My weight is stable and my doctor is very pleased with my health progress.",
    rating: 5,
    initials: "JH",
    avatarBg: "#EEEDFE",
    avatarColor: "#3C3489",
    quoteColor: "#EEEDFE",
  },
];

const stats = [
  { value: "80+", label: "Care institutions" },
  { value: "2,400+", label: "Elderly users" },
  { value: "94%", label: "AI accuracy rate" },
  { value: "40%", label: "Better health outcomes" },
];

function StarIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" style={{ fill: "#FACC15" }}>
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

function QuoteIcon({ color }) {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" style={{ marginBottom: 16, flexShrink: 0 }}>
      <path
        d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"
        fill={color}
      />
      <path
        d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"
        fill={color}
      />
    </svg>
  );
}

function TestimonialCard({ testimonial }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#fff",
        border: `0.5px solid ${hovered ? "#C0DD97" : "#e5e7eb"}`,
        borderRadius: 14,
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        transition: "border-color 0.2s",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 18,
          right: 20,
          fontSize: 64,
          lineHeight: 1,
          color: "#f3f4f6",
          fontFamily: "Georgia, serif",
          userSelect: "none",
        }}
      >
        "
      </span>

      <QuoteIcon color={testimonial.quoteColor} />

      <p style={{ fontSize: 14, color: "#374151", lineHeight: 1.72, flex: 1, marginBottom: 20 }}>
        {testimonial.body}
      </p>

      <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <StarIcon key={i} />
        ))}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          paddingTop: 16,
          borderTop: "0.5px solid #f3f4f6",
        }}
      >
        <div
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            background: testimonial.avatarBg,
            color: testimonial.avatarColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {testimonial.initials}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 2 }}>
            {testimonial.name}
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>{testimonial.title}</div>
        </div>
      </div>
    </div>
  );
}

export default function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      style={{
        background: "#ffffff",
        padding: "80px 0",
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <style>{testimonialsStyles}</style>

      <div className="ts-inner">

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: ".1em",
              textTransform: "uppercase",
              color: "#3B6D11",
              marginBottom: 10,
            }}
          >
            Real Stories
          </p>
          <h2
            className="ts-heading"
            style={{ fontWeight: 700, color: "#111827", lineHeight: 1.22, marginBottom: 12 }}
          >
            What our clients say
          </h2>
          <p
            className="ts-sub"
            style={{ color: "#6b7280", maxWidth: 480, lineHeight: 1.7, margin: "0 auto" }}
          >
            Trusted by care institutions and loved by the communities they serve.
          </p>
        </div>

        {/* Testimonial cards */}
        <div className="ts-grid">
          {testimonials.map((t) => (
            <TestimonialCard key={t.name} testimonial={t} />
          ))}
        </div>

        {/* Stats row */}
        <div className="ts-stats">
          {stats.map(({ value, label }) => (
            <div
              key={label}
              style={{
                background: "#f9fafb",
                border: "0.5px solid #e5e7eb",
                borderRadius: 12,
                padding: "20px 16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 28, fontWeight: 700, color: "#3B6D11", marginBottom: 4 }}>
                {value}
              </div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}