import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Register = () => {
    const {t} = useTranslation();
    const navigate = useNavigate();
    const apiBase = import.meta.env.VITE_API_BASE_URL;
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
        country: "CZECHIA"
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Import BE url v Register: ", import.meta.env.VITE_API_BASE_URL);

        const response = await fetch(`${apiBase}/api/user`, {
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
            <h2> {t('Register')} </h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label>Email</label>
                    <input type="email" className="form-control" name="mail" value={formData.mail} onChange={handleChange} required />
                </div>

                <div className="mb-3">
                    <label> {t('Password')} </label>
                    <input type="password" className="form-control" name="password" value={formData.password} onChange={handleChange} required />
                </div>

                <div className="mb-3">
                    <label> {t('NameCompany')} </label>
                    <input className="form-control" name="name" value={formData.name} onChange={handleChange} />
                </div>

                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label> {t('CIN')} </label>
                        <input className="form-control" name="identificationNumber" value={formData.identificationNumber} onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label> {t('VATIN')} DIČ</label>
                        <input className="form-control" name="taxNumber" value={formData.taxNumber} onChange={handleChange} />
                    </div>
                </div>

                <div className="row">
                    <div className="col-md-6 mb-3">
                        <label> {t('BankAccountNr')} </label>
                        <input className="form-control" name="accountNumber" value={formData.accountNumber} onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label> {t('BankCode')} </label>
                        <input className="form-control" name="bankCode" value={formData.bankCode} onChange={handleChange} />
                    </div>
                </div>

                <div className="mb-3">
                    <label>IBAN</label>
                    <input className="form-control" name="iban" value={formData.iban} onChange={handleChange} />
                </div>

                <div className="mb-3">
                    <label> {t('Phone')} </label>
                    <input className="form-control" name="telephone" value={formData.telephone} onChange={handleChange} />
                </div>

                <div className="row">
                    <div className="col-md-8 mb-3">
                        <label> {t('Street')} </label>
                        <input className="form-control" name="street" value={formData.street} onChange={handleChange} />
                    </div>
                    <div className="col-md-4 mb-3">
                        <label> {t('ZIP')} </label>
                        <input className="form-control" name="zip" value={formData.zip} onChange={handleChange} />
                    </div>
                </div>

                <div className="mb-3">
                    <label> {t('City')}</label>
                    <input className="form-control" name="city" value={formData.city} onChange={handleChange} />
                </div>

                <div className="mb-3">
                    <label> {t('Country')} (Country enum)</label>
                    <select className="form-select" name="country" value={formData.country} onChange={handleChange}>
                        <option value="CZECHIA"> {t('CZECHIA')} </option>
                        <option value="SLOVAKIA"> {t('SLOVAKIA')} </option>
                    </select>
                </div>

                <div className="mb-3">
                    <label> {t('Note')} </label>
                    <textarea className="form-control" name="note" value={formData.note} onChange={handleChange} />
                </div>

                <button type="submit" className="btn btn-success">
                    {t('Register')}
                </button>
            </form>
        </div>
    );
};

export default Register;