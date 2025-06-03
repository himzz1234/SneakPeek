import sgMail from "@sendgrid/mail";
const apiKey = process.env.TWILIO_SENDGRID_APIKEY;

sgMail.setApiKey(apiKey);

export const Notification = {
  WELCOME: "WELCOME",
  LOWEST_PRICE: "LOWEST_PRICE",
  THRESHOLD_MET: "THRESHOLD_MET",
};

export const generateEmailBody = (product, type) => {
  console.log(product);
  const THRESHOLD_PERCENTAGE = 40;

  let subject = "";
  let body = "";

  switch (type) {
    case Notification.WELCOME:
      subject = `Welcome to Price Tracking for ${product.title}`;
      body = `
        <div>
          <h2>Welcome to SneakPeek</h2>
          <p>You are now tracking ${product.title}.</p>
          <p>Stay tuned for more updates on ${product.title} and other products you're tracking.</p>
        </div>
      `;
      break;

    case Notification.LOWEST_PRICE:
      subject = `Lowest Price Alert for ${product.title}`;
      body = `
        <div>
          <h4>Hey, ${product.title} has reached its lowest price ever!!</h4>
          <p>Grab the product <a href="${product.sources[0].url}" target="_blank" rel="noopener noreferrer">here</a> now.</p>
        </div>
      `;
      break;

    case Notification.THRESHOLD_MET:
      subject = `Discount Alert for ${product.title}`;
      body = `
        <div>
          <h4>Hey, ${product.title} is now available at a discount more than ${THRESHOLD_PERCENTAGE}%!</h4>
          <p>Grab it right away from <a href="${product.sources[0].url}" target="_blank" rel="noopener noreferrer">here</a>.</p>
        </div>
      `;
      break;

    default:
      throw new Error("Invalid notification type.");
  }

  return { subject, body };
};

export const sendEmail = async (emailContent, sendTo) => {
  const messageOptions = {
    to: sendTo.email,
    from: {
      name: "SneakPeek",
      email: "himanshuhim1230@gmail.com",
    },
    subject: emailContent.subject,
    html: emailContent.body,
  };

  try {
    await sgMail.send(messageOptions);
    console.log("mail sent");
  } catch (error) {
    throw new Error(error);
  }
};
