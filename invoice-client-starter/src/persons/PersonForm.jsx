import {useEffect, useState} from "react";
import {useNavigate, useParams, Link} from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import {apiGet, apiPost, apiPut} from "../utils/api";
import { useTranslation } from "react-i18next";

import InputField from "../components/InputField";
import InputCheck from "../components/InputCheck";
import FlashMessage from "../components/FlashMessage";

import Country from "./Country";

const PersonForm = () => {
    const{t} = useTranslation();
    const {token} = useAuth();
    const navigate = useNavigate();
    const {id} = useParams();
    const [person, setPerson] = useState({
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
        country: Country.CZECHIA,
        note: ""
    });
    const [sentState, setSent] = useState(false);
    const [successState, setSuccess] = useState(false);
    const [errorState, setError] = useState(null);

    useEffect(() => {
        if (id) {
            apiGet("/api/persons/" + id, {}, token).then((data) => setPerson(data));
        }
    }, [id,token]);

    const handleSubmit = (e) => {
        e.preventDefault();

        (id ? apiPut("/api/persons/" + id, person, token) : apiPost("/api/persons", person, token))
            .then(() => {
                setSent(true);
                setSuccess(true);
                navigate("/persons");
            })
            .catch((error) => {
                console.log(error.message);
                setError(error.message);
                setSent(true);
                setSuccess(false);
            });
    };

    const sent = sentState;
    const success = successState;

    return (
        <div>
            <h1>{id ? t('UpdatePerson') : t('CreatePerson')}</h1>
            <hr/>
            {errorState ? (
                <div className="alert alert-danger">{errorState}</div>
            ) : null}
            {sent && (
                <FlashMessage
                    theme={success ? "success" : ""}
                    text={success ? t('PersonSuccessfullySaved') : ""}
                />
            )}
            <form onSubmit={handleSubmit}>
                <InputField
                    required={true}
                    type="text"
                    name="personName"
                    min="3"
                    label={t('NamePerson')}
                    prompt={t('InsertPersonName')}
                    value={person.name}
                    handleChange={(e) => {
                        setPerson({...person, name: e.target.value});
                    }}
                />

                <InputField
                    required={true}
                    type="text"
                    name="identificationNumber"
                    min="3"
                    label={t('CIN')}
                    prompt={t('InsertCIN')}
                    value={person.identificationNumber}
                    handleChange={(e) => {
                        setPerson({...person, identificationNumber: e.target.value});
                    }}
                />

                <InputField
                    required={true}
                    type="text"
                    name="taxNumber"
                    min="3"
                    label={t('VATIN')}
                    prompt={t('InsertVATIN')}
                    value={person.taxNumber}
                    handleChange={(e) => {
                        setPerson({...person, taxNumber: e.target.value});
                    }}
                />

                <InputField
                    required={true}
                    type="text"
                    name="accountNumber"
                    min="3"
                    label={t('BankAccountNr')}
                    prompt={t('InsertBankAccountNr')}
                    value={person.accountNumber}
                    handleChange={(e) => {
                        setPerson({...person, accountNumber: e.target.value});
                    }}
                />

                <InputField
                    required={true}
                    type="text"
                    name="bankCode"
                    min="3"
                    label={t('BankCode')}
                    prompt={t('InsertBankCode')}
                    value={person.bankCode}
                    handleChange={(e) => {
                        setPerson({...person, bankCode: e.target.value});
                    }}
                />

                <InputField
                    required={true}
                    type="text"
                    name="IBAN"
                    min="3"
                    label="IBAN"
                    prompt={t('InsertIBAN')}
                    value={person.iban}
                    handleChange={(e) => {
                        setPerson({...person, iban: e.target.value});
                    }}
                />

                <InputField
                    required={true}
                    type="text"
                    name="telephone"
                    min="3"
                    label={t('Phone')}
                    prompt={t('InsertPhone')}
                    value={person.telephone}
                    handleChange={(e) => {
                        setPerson({...person, telephone: e.target.value});
                    }}
                />

                <InputField
                    required={true}
                    type="text"
                    name="mail"
                    min="3"
                    label="Mail"
                    prompt={t('InsertEmail')}
                    value={person.mail}
                    handleChange={(e) => {
                        setPerson({...person, mail: e.target.value});
                    }}
                />

                <InputField
                    required={true}
                    type="text"
                    name="street"
                    min="3"
                    label={t('Street')}
                    prompt={t('InsertStreet')}
                    value={person.street}
                    handleChange={(e) => {
                        setPerson({...person, street: e.target.value});
                    }}
                />

                <InputField
                    required={true}
                    type="text"
                    name="ZIP"
                    min="3"
                    label={t('ZIP')}
                    prompt={t('InsertZIP')}
                    value={person.zip}
                    handleChange={(e) => {
                        setPerson({...person, zip: e.target.value});
                    }}
                />

                <InputField
                    required={true}
                    type="text"
                    name="city"
                    min="3"
                    label={t('City')}
                    prompt={t('InsertCity')}
                    value={person.city}
                    handleChange={(e) => {
                        setPerson({...person, city: e.target.value});
                    }}
                />

                <InputField
                    required={true}
                    type="text"
                    name="note"
                    label={t('Note')}
                    prompt={t('InsertNote')}
                    value={person.note}
                    handleChange={(e) => {
                        setPerson({...person, note: e.target.value});
                    }}
                />

                <h6>{t('Country')}</h6>

                <InputCheck
                    type="radio"
                    name="country"
                    label={t('CZECHIA')}
                    value={Country.CZECHIA}
                    handleChange={(e) => {
                        setPerson({...person, country: e.target.value});
                    }}
                    checked={Country.CZECHIA === person.country}
                />

                <InputCheck
                    type="radio"
                    name="country"
                    label={t('SLOVAKIA')}
                    value={Country.SLOVAKIA}
                    handleChange={(e) => {
                        setPerson({...person, country: e.target.value});
                    }}
                    checked={Country.SLOVAKIA === person.country}
                />
                <div className="d-flex justify-content-between mt-4">
                    <Link to={"/persons"} className="btn btn-secondary mt-2">
                        {t('BackToPeople')}
                    </Link>
                    <input type="submit" className="btn btn-primary" value={t('Save')}/>
                </div>
            </form>
        </div>
    );
};

export default PersonForm;
