import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        password: "",
        name: "",
        identificationNumber: "",
        taxNumber: "",
        accountNumber: "",
        bankCode: "",
        iban: "",
        telephone: "",
        mail: "",
        street: "",
        zip: "",
        city: "",
        note: "",
        country: "CzechRepublic", // výchozí hodnota enumu (přizpůsob pokud jiná)
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const response = await fetch("/api/user", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(formData),
            // credentials: "include" // 🍪 cookies verze (zakomentováno)
        });

        if (response.ok) {
            alert("Registrace úspěšná!");
            navigate("/login");
        } else {
            const errorData = await response.json();
            alert("Registrace selhala: " + JSON.stringify(errorData));
        }
    };

    return (
        <div className="container mt-5">
            <h2>Registrace</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label>Email</label>
                    <input type="email" className="form-control" name="mail" value={formData.mail} onChange={handleChange} required />
                </div>

                <div className="mb-3">
                    <label>Heslo</label>
                    <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} required />
                </div>

                <div className="mb-3">
                    <label>Jméno / Firma</label>
                    <input className="form-control" name="name" value={formData.name} onChange={handleChange} />
                </div>

                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label>IČO</label>
                        <input className="form-control" name="identificationNumber" value={formData.identificationNumber} onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label>DIČ</label>
                        <input className="form-control" name="taxNumber" value={formData.taxNumber} onChange={handleChange} />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label>Číslo účtu</label>
                        <input className="form-control" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label>Kód banky</label>
                        <input className="form-control" name="bankCode" value={formData.bankCode} onChange={handleChange} />
                    </div>
                </div>

                <div className="mb-3">
                    <label>IBAN</label>
                    <input className="form-control" name="iban" value={formData.iban} onChange={handleChange} />
                </div>

                <div className="mb-3">
                    <label>Telefon</label>
                    <input className="form-control" name="telephone" value={formData.telephone} onChange={handleChange} />
                </div>

                <div className="row">
                    <div className="col-md-8 mb-3">
                        <label>Ulice</label>
                        <input className="form-control" name="street" value={formData.street} onChange={handleChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label>PSČ</label>
                        <input className="form-control" name="zip" value={formData.zip} onChange={handleChange} />
                    </div>
                </div>

                <div className="mb-3">
                    <label>Město</label>
                    <input className="form-control" name="city" value={formData.city} onChange={handleChange} />
                </div>

                <div className="mb-3">
                    <label>Země (Country enum)</label>
                    <select className="form-select" name="country" value={formData.country} onChange={handleChange}>
                        <option value="CzechRepublic">Česká republika</option>
                        <option value="Slovakia">Slovensko</option>
                        <option value="Germany">Německo</option>
                        {/* přidej další možnosti podle enumu Country */}
                    </select>
                </div>

                <div className="mb-3">
                    <label>Poznámka</label>
                    <textarea className="form-control" name="note" value={formData.note} onChange={handleChange} />
                </div>

                <button type="submit" className="btn btn-success">
                    Registrovat se
                </button>
            </form>
        </div>
    );
};

export default Register;