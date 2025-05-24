import { useState } from "react";
import { useNavigate } from "react-router-dom";
import background from "./assets/Images/4060492.jpg";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";



function SignUp({ setIsLoggedIn }) {
  const [userInfo, setUserInfo] = useState({
    email: "",
    userName: "",
    password: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setUserInfo({
      ...userInfo,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { email, userName, password, confirmPassword } = userInfo;

    if (!email || !userName || !password || !confirmPassword) {
    alert("All fields are required");
    return;
    }
    if (password !== confirmPassword) {
     alert("Passwords do not match");
      return;
    }
    console.log("try fetch method");
    try {
      const response = await fetch("https://callicom.onrender.com/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({email, userName, password}),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Account created!");
        setIsLoggedIn(true);
        navigate("/");
      } else {
        alert("Signup failed");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert("An error occurred during login");
    }
  };

  return (
    <div
      className="bg-repeat bg-[length:1920px_1080px] w-screen min-h-screen"
      style={{ backgroundImage: `url(${background})` }}
    >
      <Navbar />
      <div className="pt-16"></div>

      <form
        onSubmit={handleSubmit}
        className="text-white flex flex-col p-6 max-w-md mx-auto"
      >
        <div className="border border-gray-400 p-6 w-full rounded-none bg-black" style= {{ fontFamily: 'Geist_Mono' }}>
          <h1 className="text-4xl font-bold p-2 bg-orange-500">
            SIGNUP ::/
          </h1>
          <h2 class="text-sm">
            <span className="text-orange-500 ">CALLI/COM</span> UNCC IDENT
            SERVICE // SIGNUP
          </h2>
          <p class="text-xs py-2 text-neutral-400/80">
            {">"}//[CALLI:COM USERIDENT]:: Input: New User & Password
          </p>
          <p class="text-sm py-3 px-3 text-orange-400/80 border-l-4 border-orange-400">
            Sign up to access the character creator and manage characters.
          </p>

          <h3 className="text-lg text-white text-center">
            Sign Up
          </h3>

          <label>Email:</label>
          <input
            type="text"
            name="email"
            value={userInfo.email}
            onChange={handleChange}
            placeholder="------"
            className="border border-gray-400 p-2 w-full mb-4 rounded-none bg-white text-black"
          />

          <label>Username:</label>
          <input
            type="text"
            name="userName"
            value={userInfo.userName}
            onChange={handleChange}
            placeholder="------"
            className="border border-gray-400 p-2 w-full mb-4 rounded-none bg-white text-black"
          />

          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={userInfo.password}
            onChange={handleChange}
            placeholder="------"
            className="border border-gray-400 p-2 w-full mb-4 rounded-none bg-white text-black"
          />

          <label>Retype Password:</label>
          <input
            type="password"
            name="confirmPassword"
            value={userInfo.confirmPassword}
            onChange={handleChange}
            placeholder="------"
            className="border border-gray-400 p-2 w-full mb-4 rounded-none bg-white text-black"
          />

          <button
            type="submit"
            className="border border-orange-500 hover:bg-orange-500 text-white py-2 w-full mb-4 mt-4 cursor-pointer"
          >
            Create Account
          </button>

          <button
            type="button"
            className="border border-orange-500 hover:bg-orange-500 text-white py-2 w-full cursor-pointer"
            onClick={() => navigate("/login")}
          >
            I Already Have an Account
          </button>
        </div>
      </form>

      <Footer />
    </div>
  );
}

export default SignUp;
