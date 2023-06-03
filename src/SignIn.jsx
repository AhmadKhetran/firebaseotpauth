import React, { useEffect, useState, useRef } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import "react-toastify/dist/ReactToastify.css";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, PhoneAuthProvider, signInWithCredential, onAuthStateChanged, signOut } from 'firebase/auth';
import { initializeApp } from "firebase/app";
import ReactLoading from 'react-loading';
import { getFirestore, collection, addDoc, query, onSnapshot, where, getDocs } from 'firebase/firestore';



const firebaseConfig = {
    apiKey: "AIzaSyB0J8Y9GQmUsxPspW8KesI-2CcI6oYgByU",
    authDomain: "fir-authapp-7dc87.firebaseapp.com",
    projectId: "fir-authapp-7dc87",
    storageBucket: "fir-authapp-7dc87.appspot.com",
    messagingSenderId: "14376722030",
    appId: "1:14376722030:web:646a11bfdea8ee3218107f"
};

const app = initializeApp(firebaseConfig);

const SignIn = () => {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [success, setSuccess] = useState(false)
    const [otp, setOtp] = useState('');
    const [accessToken, setAccessToken] = useState(null)
    const [user, setUser] = useState('')
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([]);
    const [recipients, setRecipients] = useState([])
    const [reciever, setReciever] = useState()


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
                if (!window.recaptchaVerifier) {
                    window.recaptchaVerifier = new RecaptchaVerifier(
                        "recaptcha-container",
                        {
                            size: "invisible",
                        },
                        auth
                    );
                }
                window.recaptchaVerifier.render();



                await signInWithPhoneNumber(auth, phoneNumber, window.recaptchaVerifier)
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
                .then(async (userCredential) => {
                    // User signed in successfully
                    const user = userCredential.user;
                    localStorage.setItem("accesstoken", user.accessToken);
                    localStorage.setItem("phoneNumber", user.phoneNumber);
                    // Check if the user already exists in the 'users' collection
                    const db = getFirestore();
                    const usersCollection = collection(db, 'users');
                    const querySnapshot = await getDocs(query(usersCollection, where('phoneNumber', '==', user.phoneNumber)));

                    if (querySnapshot.empty) {
                        // User doesn't exist, create a new document in the 'users' collection
                        const newUser = {
                            phoneNumber: user.phoneNumber,
                            // Other user data you want to store
                        };

                        await addDoc(usersCollection, newUser);
                        console.log('New user created:', user.phoneNumber);
                    }

                    // Store user data in localStorage or state

                    setAccessToken(user.accessToken);
                    setUser(user.phoneNumber);

                    toast.success("User signed in", {
                        position: toast.POSITION.TOP_CENTER
                    });
                })
                .catch((error) => {
                    toast.error(`${error}`, {
                        position: toast.POSITION.TOP_LEFT
                    });
                });
        } catch (error) {
            toast.error(error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accesstoken');
        localStorage.removeItem('phoneNumber');
        setAccessToken(null)
        setSuccess(null)
        const auth = getAuth();
        signOut(auth)
            .then(() => {
                toast.success("User Logged Out", {
                    position: toast.POSITION.TOP_LEFT
                });
            })
            .catch((error) => {
                // An error occurred while signing out
                // Handle the error case
            });
    }

    const handleMessageSubmit = async (e) => {
        e.preventDefault()
        // Create a reference to the messages collection in your database
        const db = getFirestore();
        const messagesCollection = collection(db, 'messages');

        const newMessage = {
            sender: user,
            recipient: reciever,
            content: message,
            timestamp: new Date().toISOString(),
        };

        try {
            // Add the new message document to the messages collection
            const docRef = await addDoc(messagesCollection, newMessage);
            console.log('Message sent:', docRef.id);
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };


    const getUsers = async () => {
        try {
            const db = getFirestore();
            const usersCollection = collection(db, 'users');
            const querySnapshot = await getDocs(usersCollection);

            const users = querySnapshot.docs.map((doc) => doc.data().phoneNumber);

            console.log('Users:', users);
            setRecipients(users)
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };





    useEffect(() => {

        getUsers();
        const token = localStorage.getItem('accesstoken');
        const phoneNumber = localStorage.getItem('phoneNumber')
        if (token) {
            setAccessToken(token)
            setUser(phoneNumber)
        }

        const auth = getAuth();

        onAuthStateChanged(auth, (user) => {
            if (user) {
                const { uid, displayName, email, phoneNumber } = user;
                console.log(uid, displayName, email, phoneNumber);
            } else {
                // User is signed out
            }
        });

        const db = getFirestore(app);
        const messagesRef = collection(db, 'messages');
        const messagesQuery = query(messagesRef, where('recipient', '==', user));

        const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
            const updatedMessages = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            updatedMessages.sort((a, b) => b.timestamp - a.timestamp);
            setMessages(updatedMessages);
        });

        return () => unsubscribe();


    }, [accessToken])

    const handleChange = (e) => {
        setReciever(e.target.value);
        console.log(e.target.value)
    };



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
            </form> : ""}

            {
                accessToken ? (
                    <>
                        <div className="signed-in-container">
                            <p className="signed-in-message">You are signed in with this Phone Number: {user}</p>
                            <button className="logout-button" onClick={handleLogout}>Log Out</button>
                        </div>
                        <div className="select-container">
                            <h4>Please Select Reciever From Below User !</h4>
                            <select value={reciever} onChange={handleChange}>
                                <option value="">Select Reciever</option>
                                {recipients.map((option, index) => (
                                    <option key={index} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>
                            <p>Selected Receiver: {reciever}</p>
                        </div>
                        <div className="messages-container">
                            <h2>Messages</h2>
                            <ul>
                                {messages.map((message) => (
                                    <li key={message.id} className="message-item">
                                        <strong>From: </strong> {message.sender}
                                        <br />
                                        <strong>Message: </strong> {message.content}
                                    </li>
                                ))}
                            </ul>
                            <form onSubmit={handleMessageSubmit}>
                                <input
                                    type="text"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    placeholder="Type your message"
                                    className="input-field"
                                />
                                <button type="submit" className="send-button">Send</button>
                            </form>
                        </div>
                    </>
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
            width: 50%;
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
          .select-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .select-container select {
            padding: 10px;
            border: none;
            border-radius: 4px;
            margin-bottom: 10px;
            width: 300px;
            background-color: lightblue;
            color: black;
          }
          
          .select-container p {
            color: black;
            background: white;
            padding: 0.7em;
            border-radius: 1em
          }
          
          .messages-container {
            background-color: rgba(255, 255, 255, 0.8);
            padding: 2em;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 20px;
          }
          
          .messages-container h2 {
            color: red;
            margin-bottom: 10px;
          }
          
          .messages-container ul {
            list-style: none;
            padding: 0;
            margin: 0;
          }
          
          .messages-container .message-item {
            background-color: lightblue;
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 10px;
            color: darkblue;
          }
          
          .messages-container .message-item strong {
            font-weight: bold;
          }
          
          .messages-container form {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-top: 20px;
          }
          
          .messages-container form .input-field {
            padding: 10px;
            border: none;
            border-radius: 4px;
            margin-bottom: 10px;
            width: 300px;
            background-color: lightblue;
            color: black;
          }
          
          .messages-container form .send-button {
            padding: 10px 20px;
            background-color: blue;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
      `}</style>
        </div>
    );
};

export default SignIn;
