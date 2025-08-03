import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

const InvoiceTable = ({ label, items, deleteInvoice }) => {
    const {t} = useTranslation();
    const { isAdmin, user } = useAuth();

    return (
        <div>
            <p>
                {label} {items.length}
            </p>

            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>{t('Seller')}</th>
                        <th>{t('Buyer')}</th>
                        <th>{t('Product')}</th>
                        <th>{t('Price')}</th>
                        <th colSpan={3}>{t('Action')}</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => {
                        const isBuyer = item.buyer?.identityUserId === user?._id;
                        const isSeller = item.seller?.identityUserId === user?._id;

                        return (
                            <tr key={index + 1}>
                                <td>{index + 1}</td>
                                <td>{item.seller.name}</td>
                                <td>{item.buyer.name}</td>
                                <td>{item.product}</td>
                                <td>{item.price} Kč</td>
                                <td>
                                    <div className="btn-group">
                                        {(isAdmin || isBuyer || isSeller) && (
                                            <Link
                                                to={`/invoices/show/${item._id}`}
                                                className="btn btn-sm btn-info"
                                            >
                                                {t('Show')}
                                            </Link>
                                        )}

                                        {(isAdmin || isSeller) && (
                                            <Link
                                                to={`/invoices/edit/${item._id}`}
                                                className="btn btn-sm btn-warning"
                                            >
                                                {t('Update')}
                                            </Link>
                                        )}

                                        {isAdmin && (
                                            <button
                                                onClick={() => deleteInvoice(item._id)}
                                                className="btn btn-sm btn-danger"
                                            >
                                                {t('Delete')}
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Přidání nové faktury: povoleno všem přihlášeným */}
            <Link to={"/invoices/create"} className="btn btn-success mt-2">
                {t('NewInvoice')}
            </Link>
        </div>
    );
};

InvoiceTable.propTypes = {
    label: PropTypes.string.isRequired,
    items: PropTypes.arrayOf(
        PropTypes.shape({
            _id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
            name: PropTypes.string.isRequired,
        })
    ).isRequired,
    deleteInvoice: PropTypes.func.isRequired,
};

export default InvoiceTable;