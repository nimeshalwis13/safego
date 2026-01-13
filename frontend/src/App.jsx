import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import SeatReservationPage from "./pages/SeatReservationPage";
import FeeSummaryPage from "./pages/FeeSummaryPage";
import PaymentGateway from "./pages/PaymentGateway";
import PaymentSuccess from "./pages/PaymentSuccess";
import StudentAuth from "./components/StudentAuth";
import StudentWaitlistPage from "./pages/StudentWaitlistPage";
import StudentProfilePage from "./pages/StudentProfilePage";
import { Toaster } from "react-hot-toast";

function App() {
  return (
    <Router>
      <div style={{ fontFamily: "Arial" }}>
        <Routes>
          <Route path="/" element={<StudentAuth />} />
          <Route path="/seat-reservation" element={<SeatReservationPage />} />
          <Route path="/student-profile" element={<StudentProfilePage />} />
          <Route path="/fee-summary" element={<FeeSummaryPage />} />
          <Route path="/payment" element={<PaymentGateway />} />
          <Route path="/payment-success" element={<PaymentSuccess />} />
          <Route path="/waitlist" element={<StudentWaitlistPage />} />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;
