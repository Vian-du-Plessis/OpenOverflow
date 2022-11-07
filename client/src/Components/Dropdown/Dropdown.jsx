/* Styling */
import styles from './Dropdown.module.scss';

/* Components */
import DropDownNotification from '../DropDownNotification/DropDownNotification.component';

/* Icons/Images */
import test from '../../Assets/car.jpg';

const Dropdown = (props) => {
    return (
        <div className={styles.container}>
            <div className={styles.container__top}>
                <h5>{props.title}</h5>
            </div>
            <div className={styles.container__notifications}>
                <DropDownNotification
                    title="Hey"
                    notification="This is a very very awesome notification that you will be getting here"
                />
                <DropDownNotification
                    title="How are you doing"
                    notification="This is also a cool notification"
                />
            </div>
        </div>
    );
};

export default Dropdown;