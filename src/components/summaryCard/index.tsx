import { AiOutlineCloseCircle } from 'react-icons/ai';

import classes from './styles.module.css';

type SummaryCardProps = {
    summary: string;
    onDelete?: () => void; // ! Make non-optional
}

export default function SummaryCard(props: SummaryCardProps) {
    return (
        <div className={ classes.container }>
            <div className={ classes.header }>
                <h1>{ props.summary }</h1>

                <AiOutlineCloseCircle onClick={ props.onDelete } fontSize={ 20 } className={ classes.closeBtn } />
            </div>

            <div onClick={ props.onDelete } className={ classes.cardContent }>
                <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Porro ex placeat modi pariatur rerum facilis vitae tempora dicta. Illum, reiciendis, ea voluptas quo repellat excepturi consequatur, facere mollitia deserunt at saepe laborum maxime in et iusto dicta magnam. Ipsa corporis numquam asperiores temporibus alias saepe blanditiis quaerat consequatur nisi aspernatur voluptatum repellat tempora reprehenderit libero soluta quidem ipsum quos, sapiente molestias, totam unde debitis! Repellendus ipsum sint labore veritatis fuga quod nemo neque facilis eius sit eos dolores voluptate iste enim vel quidem cupiditate exercitationem, amet sunt iure, laborum deserunt. Eius iure esse tenetur quasi libero? Voluptatum assumenda aliquid labore.</p>
            </div>
        </div>
    );
}
