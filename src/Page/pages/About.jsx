import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from 'styled-components';
import "../CSS/About.css";
import axios from 'axios';
import { IoLogoOctocat } from "react-icons/io";
import { FaPlus } from "react-icons/fa";
import logo from '../URL/logoHelloD.png';

const Background = styled.div`
  background-color: black;
`;

const AddUserButton = styled(FaPlus)`
  font-size: 4rem;
  color: #fff;
  padding: 1rem;
  cursor: pointer;
  transition: transform 0.2s;

  @media (max-width: 1200px) {
    font-size: 4rem;
  }

  @media (max-width: 992px) {
    font-size: 3.5rem;
  }

  @media (max-width: 768px) {
    font-size: 3rem;
  }

  @media (max-width: 576px) {
    font-size: 2.5rem;
  }

  @media (max-width: 480px) {
    font-size: 2rem;
  }
`;

function About() {
  const [users, setUsers] = useState(JSON.parse(sessionStorage.getItem('user_list')) || []);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [USER_NAME, setUSER_NAME] = useState("");
  const [GENDER, setGENDER] = useState("");
  const [AGE, setAGE] = useState("");
  const [msg, setMsg] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const settopnum = sessionStorage.getItem('settop_num');
    if (settopnum) {
      fetchUsers(settopnum);
    } else {
      setMsg("셋탑 번호를 찾을 수 없습니다.");
      console.error("셋탑 번호를 찾을 수 없습니다.");
    }

    
  }, []);

  const fetchUsers = async (settopnum) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_EC2_ADDRESS}/login/${settopnum}`);
      if (response.status === 200) {
        setUsers(response.data);
        sessionStorage.setItem('user_list', JSON.stringify(response.data));
      } else {
        console.error('예상치 못한 응답 상태:', response.status);
        setMsg('사용자 데이터를 가져오는 중 오류 발생');
      }
    } catch (error) {
      console.error('사용자 데이터를 가져오는 중 오류 발생:', error);
      setMsg('사용자 데이터를 가져오는 중 오류 발생');
    }
  };

  const handleUserClick = (user_id, user_name) => {
    sessionStorage.setItem('selectedUserId', user_id);
    sessionStorage.setItem('selectedUserName', user_name);
    navigate('/Main');
  };

  const handleAddUser = () => {
    setIsSignupModalOpen(true);
  };

  const handleSignup = async () => {
    const settopnum = sessionStorage.getItem('settop_num');

    if (!USER_NAME || !GENDER || !AGE) {
      alert('모든 필드를 입력하세요.');
      return;
    }

    const newUser = {
      SETTOP_NUM: settopnum,
      USER_NAME: USER_NAME,
      GENDER: GENDER,
      AGE: parseInt(AGE)
    };

    console.log('전송할 데이터:', newUser);

    console.log('url:', `${process.env.REACT_APP_CUD_ADDRESS}/user/`);

    try {
      const response = await axios.post(`${process.env.REACT_APP_CUD_ADDRESS}/user/`, newUser);
      console.log('서버 응답:', response);

      if (response.status === 200) {
        fetchUsers(settopnum);
        setIsSignupModalOpen(false);
        setUSER_NAME("");
        setGENDER("");
        setAGE("");
        setMsg("사용자 등록이 완료되었습니다.");
      } else {
        console.error('사용자 등록 실패:', response.status);
        alert('사용자 등록에 실패했습니다.');
      }
    } catch (error) {
      console.error('사용자 등록 중 오류 발생:', error);
      alert('회원가입에 실패했습니다.');
    }
  };

  const handleAGEChange = (e) => {
    setAGE(e.target.value);
  };

  const onChangeUSER_NAME = (e) => {
    setUSER_NAME(e.target.value);
  };

  return (
    <Background>
      <header>
        <div className="Logo">
          <img src={logo} alt="Hell:D Logo" className="logo-image" />
        </div>
      </header>
      <main>
        <div className="user-selection-page">
          <h1>여러분의 웃음과 함께 하는 헬로:D</h1>
          <p>사용자를 선택하여 계속하세요.</p>
          <div className="user-grid">
            {users.map((user) => (
              <div key={user.USER_ID} className="user-card" onClick={() => handleUserClick(user.USER_ID, user.USER_NAME)}>
                <IoLogoOctocat className="user-icon-cat" />
                <p>{user.USER_NAME}</p>
              </div>
            ))}
            {users.length < 4 && (
              <AddUserButton onClick={handleAddUser} />
            )}
          </div>
          {isSignupModalOpen && (
            <div className="signup-modal">
              <div className="signup-modal-content">
                <span className="close" onClick={() => setIsSignupModalOpen(false)}>&times;</span>
                <h2>회원가입</h2>
                <input
                  type="text"
                  placeholder="이름"
                  value={USER_NAME}
                  onChange={onChangeUSER_NAME}
                />
                <select
                  value={GENDER}
                  onChange={(e) => setGENDER(e.target.value)}
                >
                  <option value="">성별 선택</option>
                  <option value="남성">남성</option>
                  <option value="여성">여성</option>
                </select>
                <select
                  value={AGE}
                  onChange={handleAGEChange}
                >
                  <option value="">나이 선택</option>
                  {Array.from({ length: 100 }, (_, i) => i).map((age) => (
                    <option key={age} value={age}>{age}세</option>
                  ))}
                </select>
                <button onClick={handleSignup}>가입하기</button>
                <button onClick={() => setIsSignupModalOpen(false)}>취소</button>
              </div>
            </div>
          )}
          {msg && <div className="msg">{msg}</div>}
        </div>
      </main>
    </Background>
  );
}

export default About;
