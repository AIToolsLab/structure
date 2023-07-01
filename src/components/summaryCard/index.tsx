import { AiOutlineCloseCircle } from 'react-icons/ai';

import classes from './styles.module.css';

type SummaryCardProps = {
    card: Card;
    onDelete?: () => void; // ! Make non-optional
}

export default function SummaryCard(props: SummaryCardProps) {
    return (
        <div className={ classes.container }>
            <div className={ classes.header }>
                <h1>{ props.card.title }</h1>

                <AiOutlineCloseCircle onClick={ props.onDelete } fontSize={ 20 } className={ classes.closeBtn } />
            </div>

            <div onClick={ props.onDelete } className={ classes.cardContent }>
                <p>{ props.card.summary }</p>
            </div>
        </div>
    );
}
