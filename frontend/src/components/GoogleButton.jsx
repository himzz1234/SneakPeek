import { useEffect } from "react";

const GoogleSignInButton = ({ onSuccess }) => {
  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id:
            "925796281428-3jleci2ckhmh25stvehgruog0jmah0en.apps.googleusercontent.com",
          callback: onSuccess,
        });

        window.google.accounts.id.renderButton(
          document.getElementById("googleSignInDiv"),
          {
            theme: "outline",
            size: "large",
            width: "100%",
            type: "standard",
            logo_alignment: "center",
          }
        );
      }
    };

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = initializeGoogleSignIn;
    document.body.appendChild(script);

    return () => {
      document.getElementById("googleSignInDiv")?.replaceChildren();
    };
  }, [onSuccess]);

  return (
    <div className="w-full flex justify-center">
      <div id="googleSignInDiv" className="w-full" />
    </div>
  );
};

export default GoogleSignInButton;
