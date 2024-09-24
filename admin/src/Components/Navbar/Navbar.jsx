import React from 'react'
import './Navabar.css'
import navlogo from '../../assets/nav-logo.svg';
import navprofileIcon from '../../assets/nav-profile.svg'
const Navbar = () => {
  return (
    <div className='navbar'>

      <img  className="nav-log"  src={navlogo} alt="" />
      <img className="nav-profile" src={navprofileIcon} alt="" />



    </div>
  )
}

export default Navbar