import React, { useEffect, useState } from 'react';

import Amplify from '@aws-amplify/core';
import { withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { Auth } from '@aws-amplify/auth';
import API, { graphqlOperation } from '@aws-amplify/api';
import '@aws-amplify/pubsub';


import { createMessage } from './graphql/mutations';
import { onCreateMessage } from './graphql/subscriptions';
import { messagesByChannelID } from './graphql/queries';

import awsExports from './aws-exports';
import './App.css';

Amplify.configure(awsExports);

function App() {

  const [userInfo, setUserInfo] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageBody, setMessageBody] = useState('');

  useEffect(() => {
    Auth.currentUserInfo().then((userInfo) => {
      setUserInfo(userInfo)
    })
  }, [])

  useEffect(() => {
    API
      .graphql(graphqlOperation(messagesByChannelID, {
        channelID: '1',
        sortDirection: 'ASC'
      }))
      .then((response) => {
        const items = response.data.messagesByChannelID.items;

        if (items) {
          setMessages(items);
        }
      })
  }, []);

  useEffect(() => {
    const subscription = API
      .graphql(graphqlOperation(onCreateMessage))
      .subscribe({
        next: (event) => {
          setMessages([...messages, event.value.data.onCreateMessage]);
        }
      });

    return () => {
      subscription.unsubscribe();
    }
  }, [messages]);

  const handleChange = (event) => {
    setMessageBody(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    // console.log("===1==");
    // console.log(userInfo);
    // console.log("===2==");
    const input = {
      channelID: '1',
      author: userInfo.username,
      body: messageBody.trim()
    };

    try {
      setMessageBody('');
      await API.graphql(graphqlOperation(createMessage, { input }))
    } catch (error) {
      console.warn(error);
    }
  };

  return (
    <div>
      <div className="container">
        <div className="messages">
          <div className="messages-scroller">
            {messages.map((message) => {
              //console.log(message);
              return(
              <div
                key={message.id}
                className={message.author === userInfo?.username ? 'message me' : 'message'}>{message.body}</div>
              )
            })}
          </div>
        </div>
        <div className="chat-bar">
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="message"
              placeholder="Type your message here..."
              disabled={userInfo === null}
              onChange={handleChange}
              value={messageBody} />
          </form>
        </div>
        <div className="ctitle">* This live chat test is built by Amplify + React + GraphQL YZ</div>
      </div>
    </div>
  );
}

export default withAuthenticator(App);