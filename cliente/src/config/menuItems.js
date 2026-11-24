
import {
    MdHome,
    MdInventory,
    MdPointOfSale,
    MdPeople,
    MdHistory,
    MdWarehouse
} from 'react-icons/md';

const menuItems = [
    {
        path: '/',
        label: 'Dashboard',
        icon: MdHome
    },
    {
        path: '/productos',
        label: 'Productos',
        icon: MdInventory
    },
    {
        path: '/stock',
        label: 'Inventario',
        icon: MdWarehouse
    },
    
    {
        path: '/ventas',
        label: 'Ventas',
        icon: MdPointOfSale
    },
    
];

export default menuItems;
