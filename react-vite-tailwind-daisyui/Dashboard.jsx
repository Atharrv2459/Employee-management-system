import { useNavigate } from "react-router-dom";
export default function Dashboard()
{
    const navigate= useNavigate();
    const Punch =()=>{
        navigate('/employee/punch')
    }
    const Manual = ()=>{
        navigate('/employee/manual-entry')
    }
    const Profile = ()=>{
        navigate('/employee/profile')
    }
     const Apply = ()=>{
        navigate('/employee/leaves/apply')
    }
    return(<div className="flex flex-row items-center justify-center">
        <button onClick={Punch} className="btn">Punch Attendance</button>
        <button onClick={Manual} className="btn">Manual entry</button>
        <button onClick={Profile} className="btn">Profile</button>
            <button onClick={Apply} className="btn">Leave apply</button>

    </div>);

}