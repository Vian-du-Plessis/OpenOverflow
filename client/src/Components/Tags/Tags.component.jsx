/* React */
import React from 'react';

/* Styling */
import styles from "./Tags.module.scss"

const Tags = ({title, id,  ...otherProps}) => {
    return (
        <div className={styles.container} {...otherProps} id={id}>
            <p>
                {title}
            </p>
        </div>
    );
};

export default Tags;