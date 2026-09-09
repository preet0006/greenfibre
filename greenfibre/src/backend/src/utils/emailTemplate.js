export const baseEmailTemplate = ({
    title,
    subtitle,
    body,
    highlight,
    footerNote,
}) => {
    const logoUrl = "http://localhost:9000/media/logo.png"; // Update with actual Green Fibre logo

    return `
  <div style="
    max-width:600px;
    margin:auto;
    font-family:'Segoe UI', 'Arial', sans-serif;
    padding:40px 15px;
    background:#f8fdfb;
  ">

    <div style="
      background:#ffffff;
      border-radius:20px;
      overflow:hidden;
      border:1px solid #d1fae5;
      box-shadow:0 10px 40px rgba(21, 128, 61, 0.08);
    ">

      <!-- Logo Section -->
      <div style="
        padding:35px 20px 25px;
        text-align:center;
        background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
      ">
        <img 
          src="${logoUrl}" 
          alt="Green Fibre"
          width="180"
          style="display:block;margin:auto;"
          loading="eager"
        />
      </div>

      <!-- Accent Divider -->
      <div style="
        height:4px;
        background:linear-gradient(90deg, #15803d, #16a34a, #22c55e);
      "></div>

      <!-- Header -->
      <div style="
        padding:35px 35px 10px;
        text-align:center;
      ">
        <h2 style="
          margin:0;
          font-size:26px;
          color:#15803d;
          font-weight:600;
          letter-spacing:0.3px;
          font-family:'Cormorant Garamond', Georgia, serif;
        ">
          ${title}
        </h2>

        ${
            subtitle
                ? `<p style="
                    margin:12px 0 0;
                    font-size:14px;
                    color:#16a34a;
                    font-weight:500;
                  ">
                    ${subtitle}
                  </p>`
                : ""
        }
      </div>

      <!-- Body -->
      <div style="
        padding:15px 40px 35px;
        font-size:15px;
        line-height:1.8;
        color:#374151;
        text-align:center;
      ">
        ${body}

        ${
            highlight
                ? `<div style="
                    margin:30px 0;
                    padding:24px;
                    border-radius:16px;
                    background:linear-gradient(135deg, #dcfce7, #d1fae5);
                    border:2px solid #16a34a;
                  ">
                    <span style="
                      font-size:28px;
                      letter-spacing:6px;
                      font-weight:700;
                      color:#15803d;
                      display:block;
                    ">
                      ${highlight}
                    </span>
                  </div>`
                : ""
        }

        ${footerNote || ""}
      </div>

      <!-- Footer -->
      <div style="
        padding:25px;
        text-align:center;
        font-size:12px;
        color:#6b7280;
        background:#fafdfb;
      ">
        <div style="margin-bottom:12px;">
          © ${new Date().getFullYear()} <b style="color:#15803d;">Green Fibre</b>
        </div>
        <div style="
          font-size:11px;
          color:#9ca3af;
          font-style:italic;
        ">
          Sustainability, Simplified 🌱
        </div>
        <div style="
          margin-top:15px;
          padding-top:15px;
          border-top:1px solid #d1fae5;
        ">
          <a href="https://greenfibre.com" style="
            color:#16a34a;
            text-decoration:none;
            margin:0 8px;
            font-weight:500;
          ">Website</a>
          <span style="color:#d1fae5;">|</span>
          <a href="https://greenfibre.com/contact" style="
            color:#16a34a;
            text-decoration:none;
            margin:0 8px;
            font-weight:500;
          ">Contact</a>
          <span style="color:#d1fae5;">|</span>
          <a href="https://greenfibre.com/sustainability" style="
            color:#16a34a;
            text-decoration:none;
            margin:0 8px;
            font-weight:500;
          ">Our Mission</a>
        </div>
      </div>

    </div>
  </div>
  `;
};