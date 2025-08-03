import {useEffect, useState} from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../utils/api"; 
import { useTranslation } from "react-i18next";
import Country from "./Country";

const PersonDetail = () => {
    const {t} = useTranslation();
    const {id} = useParams();
    const [person, setPerson] = useState({});
    const [sellerInvoice, setSellerInvoice] = useState([]);
    const [buyerInvoice, setBuyerInvoice] = useState([]);

    const country = person.country ? Country[person.country] : "N/A";

    useEffect(() => {
        apiGet("/api/persons/" + id)
            .then((data) => {
                setPerson(data);
            })
            .catch((error) => {
                console.error(error);
            });
    }, [id]);

    useEffect(() => {
        apiGet("/api/invoices")
            .then((data) => {
                const filtered = data.filter(
                    (item) => item.seller?._id?.toString() === id);
                setSellerInvoice(filtered);
            });
    }, []);

    useEffect(() => {
        apiGet("/api/invoices")
            .then((data) => {
                const filtered = data.filter(
                    (item) => item.buyer?._id?.toString() === id);
                setBuyerInvoice(filtered);
            });
    }, []);

    return (
        <>
            <div>
                <h1> {t('PersonDetail')} </h1>
                <hr/>
                <h3>{person.name} ({person.identificationNumber})</h3>
                <p>
                    <strong>{t('VATIN')} :</strong>
                    <br/>
                    {person.taxNumber}
                </p>
                <p>
                    <strong>{t('BankAccountNr')} :</strong>
                    <br/>
                    {person.accountNumber}/{person.bankCode} ({person.iban})
                </p>
                <p>
                    <strong>Tel.:</strong>
                    <br/>
                    {person.telephone}
                </p>
                <p>
                    <strong>Email:</strong>
                    <br/>
                    {person.mail}
                </p>
                <p>
                    <strong>{t('Residence')} :</strong>
                    <br/>
                    {person.street}, {person.city},
                    {person.zip}, {country}
                </p>
                <p>
                    <strong>{t('Note')} :</strong>
                    <br/>
                    {person.note}
                </p>
            </div>

            <div>
                <p>
                    {t('SellersInvoiceCount')}: {sellerInvoice.length}
                </p>

                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>{t('Seller')}</th>
                            <th>{t('Buyer')}</th>
                            <th>{t('Price')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sellerInvoice.map((item, index) => (
                            <tr key={index + 1}>
                                <td>{index + 1}</td>
                                <td>{item.seller.name}</td>
                                <td>{item.buyer.name}</td>
                                <td>{item.price} Kč</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div>
                <p>
                    {t('BuyersInvoiceCount')}: {buyerInvoice.length}
                </p>

                <table className="table table-bordered">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>{t('Seller')}</th>
                            <th>{t('Buyer')}</th>
                            <th>{t('Price')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {buyerInvoice.map((item, index) => (
                            <tr key={index + 1}>
                                <td>{index + 1}</td>
                                <td>{item.seller.name}</td>
                                <td>{item.buyer.name}</td>
                                <td>{item.price} Kč</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <Link to={"/persons"} className="btn btn-secondary mt-2">
                {t('BackToPeople')}
            </Link>
        </>
    );
};

export default PersonDetail;
