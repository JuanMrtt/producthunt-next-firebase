import React, { useEffect, useContext, useState } from 'react'
import { useRouter } from 'next/router'
import { FirebaseContext } from '../../firebase'

import Layout from '../../components/layout/Layout'
import Error404 from '../../components/layout/404'
import { css } from '@emotion/core'
import styled from '@emotion/styled'

import formatDistanceToNow from 'date-fns/formatDistanceToNow'
import { es } from 'date-fns/locale'

import { Div, InputSubmit } from '../../components/ui/Formulario';

import Button from '../../components/ui/Boton'

const ContenedorProducto = styled.div`
   @media (min-width:768px) {
        display: grid;
        grid-template-columns: 2fr 1fr;
        column-gap: 2rem;
   }
`;

const Producto = () => {

    // State del componente
    const [producto, guardarProducto] = useState({})
    const [error, guardarError] = useState(false)
    const [comentario, guardarComentario] = useState({})

    // Routing para obtener el id actual
    const router = useRouter()
    const { query: { id } } = router

    // Context de firebase
    const { firebase, usuario } = useContext(FirebaseContext)

    useEffect(() => {
        if (id) {
            const obtenerProducto = async () => {
                const productoQuery = await firebase.db.collection('productos').doc(id)
                const producto = await productoQuery.get()
                if (producto.exists) {
                    guardarProducto(producto.data())
                } else {
                    guardarError(true)
                }
            }
            obtenerProducto()
        }

    }, [id, producto])

    if (Object.keys(producto).length === 0) return `Cargando`

    const { comentarios, creado, descripcion, empresa, nombre, url, urlimagen, votos, creador, haVotado } = producto

    // Administrar y validar los votos
    const votarProducto = () => {
        if (!usuario) {
            return router.push('/login')
        }
        // Obtener y sumar un nuevo voto
        const nuevoTotal = votos + 1

        // Verificar si el usuario actual ha votado
        if (haVotado.includes(usuario.uid)) return;

        // guardar el ID del usuario que ha votado
        const nuevoHaVotado = [...haVotado, usuario.uid];

        //  Actualizar en la BD
        firebase.db.collection('productos').doc(id).update({
            votos: nuevoTotal,
            haVotado: nuevoHaVotado
        })

        // Actualizar el state
        guardarProducto({
            ...producto,
            votos: nuevoTotal
        })

    }

    // Funciones para crear comentarios
    const comentarioChange = e => {
        guardarComentario({
            ...comentario,
            [e.target.name]: e.target.value
        })
    }
    const agregarComentario = e => {
        e.preventDefault()

        if (!usuario) {
            return router.push('/login')
        }

        // Información extra al comentario
        comentario.usuarioId = usuario.uid
        comentario.usuarioNombre = usuario.displayName

        // Tomar copia de comentarios y agregarlos al arreglo
        const nuevosComentarios = [...comentarios, comentario]

        // Actualizar BD
        firebase.db.collection('productos').doc(id).update({
            comentarios: nuevosComentarios
        })

        // Actualizar el state
        guardarProducto({
            ...producto,
            comentarios: nuevosComentarios
        })

    }

    return (
        <Layout>
            <>
                {error && <Error404 />}

                <div className="contenedor">
                    <h1 css={css`
                        text-align: center;
                        margin-top: 5rem;
                        `}>{nombre}</h1>
                </div>
                <ContenedorProducto>
                    <div>
                        <p>Publicado hace: {formatDistanceToNow(new Date(creado), { locale: es })}</p>
                        <p> Por {creador.nombre} de {empresa}</p>
                        <img src={urlimagen} />
                        <p>{descripcion}</p>

                        {usuario && (
                            <>
                                <h2>Agrega tu comentario</h2>
                                <form
                                    onSubmit={agregarComentario}
                                >
                                    <Div>
                                        <input
                                            type="text"
                                            name="mensaje"
                                            onChange={comentarioChange}
                                        />
                                    </Div>
                                    <InputSubmit
                                        type="submit"
                                        value="agregar comentario"
                                    />
                                </form>
                            </>
                        )}

                        <h2 css={css`
                            margin: 2rem 0;
                        `}>Comentarios</h2>

                        {comentarios.length === 0 ? "Aun no hay comentarios" : (
                            <ul>
                                {comentarios.map((comentario, id) => (
                                    <li
                                        key={`${comentario.usuarioId}-${id}`}
                                        css={css`
                                            border: 1px solid #e1e1e1;
                                            padding: 2rem;
                                        `

                                        }
                                    >
                                        <p>{comentario.mensaje}</p>
                                        <p>Escrito por
                                            <span
                                                css={css`
                                                font-weight: bold;
                                            `}
                                            >
                                                {''}  {comentario.usuarioNombre}
                                            </span>
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        )}

                    </div>

                    <aside>
                        <Button
                            target="_blank"
                            bgColor="true"
                            href={url}
                        >
                            Visitar URL</Button>


                        <div
                            css={css`
                                margin-top: 5rem;
                            `}
                        >


                            <p css={css`
                            text-align: center;
                           `}>{votos} Votos</p>
                        </div>

                        {usuario && (
                            <Button
                                onClick={votarProducto}
                            >
                                Votar
                            </Button>
                        )}
                    </aside>
                </ContenedorProducto>
            </>
        </Layout>
    )
}

export default Producto