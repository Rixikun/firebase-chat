import React, { useRef, useState, useLayoutEffect } from "react";
import "./App.css";

import firebase from "firebase/app";
import "firebase/firestore";
import "firebase/auth";

import { useAuthState } from "react-firebase-hooks/auth";
import { useCollectionData } from "react-firebase-hooks/firestore";

firebase.initializeApp({
  apiKey: process.env.REACT_APP_FIREBASE_APIKEY,
  authDomain: process.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: process.env.REACT_APP_DATABASE_URL,
  projectId: process.env.REACT_APP_PROJECT_ID,
  storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_APP_ID,
  measurementId: process.env.REACT_APP_MEASUREMENT_ID,
});

const auth = firebase.auth();
const firestore = firebase.firestore();

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <header>
        <h1>React + Firebase Chat app!</h1>
        <SignOut />
      </header>

      <section>{user ? <ChatRoom /> : <SignIn />}</section>
    </div>
  );
}

function SignIn() {
  const signInWithGoogle = () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider);
  };

  return (
    <>
      <button className="sign-in" onClick={signInWithGoogle}>
        Sign in with Google
      </button>
      <p>Please be respectful</p>
    </>
  );
}

function SignOut() {
  return (
    auth.currentUser && (
      <button className="sign-out" onClick={() => auth.signOut()}>
        Sign Out
      </button>
    )
  );
}

interface ChatMessageItem {
  id: number;
  uid: string;
  text: string;
  createdAt: Date;
  photoURL?: string;
}

interface ChatMessages {
  messages?: ChatMessageItem[];
}

const ChatRoom: React.FC = () => {
  const dummy = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    console.log(dummy);
  });
  const messagesRef = firestore.collection("messages");
  const query = messagesRef.orderBy("createdAt").limit(25);

  const [messages]: any = useCollectionData(query, {
    idField: "id",
  });
  const [formValue, setFormValue] = useState("");

  const sendMessage = async (e: React.MouseEvent<HTMLFormElement>) => {
    e.preventDefault();

    let uid: string = "";
    let photoURL: string = "";
    if (auth.currentUser) {
      uid = auth.currentUser.uid;
      photoURL = auth.currentUser.photoURL || "";
    }

    await messagesRef.add({
      text: formValue,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      uid,
      photoURL,
    });

    setFormValue("");
    if (dummy.current !== null) {
      dummy.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <>
      <main>
        {messages && <ChatMessage messages={messages} />}

        <span ref={dummy}></span>
      </main>

      <form onSubmit={sendMessage}>
        <input
          value={formValue}
          onChange={(e) => setFormValue(e.target.value)}
          placeholder="say something nice"
        />

        <button type="submit" disabled={!formValue}>
          Send
        </button>
      </form>
    </>
  );
};
const ChatMessage: React.FunctionComponent<ChatMessages> = (props) => {
  const messages = props.messages;

  const res = messages?.length
    ? messages.map((msg, idx) => {
        const { text, uid, photoURL } = msg;
        const messageClass =
          uid === auth.currentUser?.uid ? "sent" : "received";
        return (
          <div className={`message ${messageClass}`} key={idx}>
            <img
              src={
                photoURL ||
                "https://pm1.narvii.com/6336/857c16b5b11e6e3a67ad74d62f667c35aab93735_00.jpg"
              }
              alt="user-icon"
            />
            <p>{text}</p>
          </div>
        );
      })
    : "";

  return <>{res}</>;
};
export default App;
