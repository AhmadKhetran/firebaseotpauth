import React, { useEffect, useState, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential } from 'firebase/auth';
import { initializeApp } from "firebase/app";
import ReactLoading from 'react-loading';


const firebaseConfig = {
  apiKey: "AIzaSyA48M9ilBgFsW5ZpAWLvn5QvifWKDB_Uc4",
  authDomain: "otpauthapp-69ead.firebaseapp.com",
  projectId: "otpauthapp-69ead",
  storageBucket: "otpauthapp-69ead.appspot.com",
  messagingSenderId: "735036461566",
  appId: "1:735036461566:web:d8bfe4873c9142e9c2b0af"
};

const app = initializeApp(firebaseConfig);

const SignIn = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [success, setSuccess] = useState(false)
    const [otp, setOtp] = useState('');
    const [accessToken, setAccessToken] = useState(null)
    const [user, setUser] = useState('')
    const recaptchaVerifierRef = useRef(null);


    const handlePhoneNumberSubmit = async (e) => {
        e.preventDefault();
        if (phoneNumber.length < 7) {
            toast.error("Enter Valid Number !", {
                position: toast.POSITION.TOP_CENTER
            });
        }
        else {
            try {
                const auth = getAuth();

                await signInWithPhoneNumber(auth, phoneNumber, appVerifierrecaptchaVerifierRef.current)
                    .then((confirmationResult) => {
                        setVerificationId(confirmationResult.verificationId);
                        console.log('OTP sent. Verification ID:', confirmationResult.verificationId);
                        setSuccess(true)
                        toast.success("OTP SENT", {
                            position: toast.POSITION.TOP_CENTER
                        });
                    })
                    .catch((error) => {
                        console.error('Error sending OTP:', error);
                        toast.error(`${error}`, {
                            position: toast.POSITION.TOP_CENTER
                        });
                    });
            } catch (error) {
                toast.error(`${error}`, {
                    position: toast.POSITION.TOP_CENTER
                });
                console.error('Error initializing Firebase:', error);
            }
        }
    };
    const handleSignInSubmit = async (e) => {
        e.preventDefault();

        try {
            const auth = getAuth();
            const credential = PhoneAuthProvider.credential(verificationId, otp);

            await signInWithCredential(auth, credential)
                .then((userCredential) => {
                    // User signed in successfully
                    const user = userCredential.user;
                    //console.log('User signed in:', user);
                    localStorage.setItem("accesstoken", user.accessToken)
                    localStorage.setItem("phoneNumber", user.phoneNumber)
                    setAccessToken(user.accessToken)
                    setUser(user.phoneNumber)
                    toast.success("User signed in", {
                        position: toast.POSITION.TOP_CENTER
                    });

                })
                .catch((error) => {
                    //console.error('Error signing in:', error);
                    toast.error(`${error}`, {
                        position: toast.POSITION.TOP_LEFT
                    });
                });
        } catch (error) {
            //console.error('Error initializing Firebase:', error);
            // Handle the error case
            toast.error(error)
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accesstoken');
        localStorage.removeItem('phoneNumber');
        setAccessToken(null)
        setSuccess(null)
        toast.success("User Logged Out", {
            position: toast.POSITION.TOP_LEFT
        });
    }

    useEffect(() => {
        const token = localStorage.getItem('accesstoken');
        const phoneNumber = localStorage.getItem('phoneNumber')
        if (token) {
            setAccessToken(token)
            setUser(phoneNumber)
        }

        recaptchaVerifierRef.current = new RecaptchaVerifier('recaptcha-container', {
            size: 'invisible',
            callback: (e) => {
                console.log(e);
            }
        });

    }, [accessToken])


    return (
        <div className="container">
            {!success & !accessToken ? <form className="form" onSubmit={handlePhoneNumberSubmit}>
                <h3>Please Enter Your Phone Number</h3>
                <input
                    className="input-field"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                />
                <button className="btn" type="submit">Send OTP</button>
            </form> : ""}

            {success & !accessToken ? <form className="form" onSubmit={handleSignInSubmit}>
            <h3>Enter OTP Sent On You Mobile Phone To Sign In </h3>
                <input
                    className="input-field"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                />
                <button className="btn" type="submit">Verify OTP</button>
            </form> :""}

            {
                accessToken ? (
                    <div className="signed-in-container">
                        <p className="signed-in-message">You are signed in with this Phone Number: {user}</p>
                        <button className="logout-button" onClick={handleLogout}>Log Out</button>
                    </div>
                ) : null
            }

            <div id="recaptcha-container"></div>

            <ToastContainer />
            <p className='para'>OTP Login With Verification</p>
            <style jsx>{`
            .para {
                color: white;
                opacity : 0.2
            }
        .container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background-image: url("https://wallpaperaccess.com/full/754632.jpg"); /* Replace with your background image */
          background-size: cover;
          backdrop-filter: blur(10px);
          background-color: rgba(0, 0, 0, 0.6); /* Adjust the opacity as desired */
        }
  
        .form {
            background-color: white;
            padding: 2em;
            border-radius: 1em;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
        }
  
        .input-field {
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 4px;
          margin-bottom: 10px;
          width: 300px;
        }
        
        .errorMsg {
            color: red;
            background-color: rgba(255, 0, 0, 0.1) 
            padding  : 1em ;
            border-radius : 2em ;
        }
        .btn {
          padding: 10px 20px;
          background-color: red;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .signed-in-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 20px;
            background-color: white;
            padding: 2em;
            border-radius: 1em;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 20px;
          }
          
          .signed-in-message {
            font-size: 18px;
            margin-bottom: 10px;
          }
          
          .logout-button {
            padding: 10px 20px;
            background-color: red;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          In the 
      `}</style>
        </div>
    );
};

export default SignIn;
