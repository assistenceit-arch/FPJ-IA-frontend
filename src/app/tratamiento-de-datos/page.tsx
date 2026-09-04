import Link from "next/link";

// Adenda 2026-09-04, a solicitud del usuario: página pública (no
// requiere sesión iniciada, ver src/proxy.ts) con el texto completo de
// la Política de Tratamiento de Datos Personales -- vive fuera del
// grupo (app), así que no hereda el encabezado ni la barra lateral de
// la aplicación autenticada, igual que /login. Contenido estático a
// propósito (sin conexión a la base de datos): es un documento legal
// que solo cambia cuando alguien decide actualizarlo deliberadamente,
// no datos que varíen por usuario.
export default function PaginaTratamientoDeDatos() {
  return (
    <div className="min-h-screen bg-institucional-50 px-6 py-12 sm:px-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/login" className="font-sans text-sm text-acento hover:underline">
          ← Volver al inicio
        </Link>

        <article className="mt-6 space-y-8 rounded-lg border border-institucional-100 bg-white p-8 shadow-sm sm:p-12">
          <header>
            <h1 className="font-display text-3xl text-institucional-950">
              Política de Protección de Datos Personales
            </h1>
            <p className="mt-1 font-sans text-lg text-institucional-700">PJ | Gestión Digital</p>
            <p className="mt-4 font-sans text-sm text-institucional-700">
              Versión 2.0 · 4 de septiembre de 2026
            </p>
          </header>

          <Seccion numero="1" titulo="Objeto y alcance">
            <p>
              Esta política describe cómo PJ | Gestión Digital (&ldquo;la plataforma&rdquo;) trata los
              datos personales de los funcionarios que la usan y de las personas mencionadas en los
              procedimientos que se gestionan a través de ella (capturados, aprehendidos, víctimas y
              testigos).
            </p>
            <p>
              Aplica a toda la información capturada, generada y almacenada por la plataforma, incluida
              la que se envía a servicios de terceros para la generación automática de documentos.
            </p>
          </Seccion>

          <Seccion numero="2" titulo="Marco normativo">
            <p>
              Esta política se enmarca en la Ley 1581 de 2012 (Régimen General de Protección de Datos
              Personales) y el Decreto 1377 de 2013, que la reglamenta.
            </p>
            <p>
              Cuando la información tratada corresponde a menores de edad, esta política se orienta
              adicionalmente por el artículo 44 de la Constitución Política de Colombia, que consagra
              el interés superior del niño como principio prevalente.
            </p>
          </Seccion>

          <Seccion numero="3" titulo="Datos que se tratan">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-sans text-sm">
                <thead>
                  <tr className="border-b border-institucional-100 text-left">
                    <th className="py-2 pr-4 font-semibold text-institucional-950">Categoría</th>
                    <th className="py-2 pr-4 font-semibold text-institucional-950">Datos incluidos</th>
                    <th className="py-2 font-semibold text-institucional-950">Nivel de sensibilidad</th>
                  </tr>
                </thead>
                <tbody className="text-institucional-800">
                  <FilaTabla
                    categoria="Funcionarios (usuarios de la plataforma)"
                    datos="Nombre, identificación, placa, cargo, correo, teléfono"
                    sensibilidad="Dato personal"
                  />
                  <FilaTabla
                    categoria="Capturados / Aprehendidos"
                    datos="Identificación completa, datos familiares, características físicas, antecedentes"
                    sensibilidad="Dato sensible (dato judicial; dato de menor de edad cuando aplique)"
                  />
                  <FilaTabla
                    categoria="Víctimas"
                    datos="Identificación, contacto, relación con el indiciado, y —según el delito— datos de salud, de privación de libertad, o de exigencias económicas"
                    sensibilidad="Dato sensible en varios de los delitos soportados"
                  />
                  <FilaTabla
                    categoria="Testigos"
                    datos="Identificación, contacto"
                    sensibilidad="Dato personal"
                  />
                  <FilaTabla
                    categoria="Elementos incautados"
                    datos="Descripciones, ubicaciones de hallazgo"
                    sensibilidad="No es dato personal en sí mismo"
                  />
                </tbody>
              </table>
            </div>
            <p>
              La plataforma da tratamiento especial a los datos de <strong>menores de edad</strong>{" "}
              (aprehendidos, víctimas de Suministro a Menor, hijos en Violencia Intrafamiliar) conforme
              al principio de interés superior del menor consagrado en el artículo 44 de la
              Constitución.
            </p>
          </Seccion>

          <Seccion numero="4" titulo="Retención y eliminación automática de procedimientos">
            <p>Este es el mecanismo central de minimización de datos de la plataforma.</p>

            <h3 className="font-sans text-base font-semibold text-institucional-950">
              4.1 Regla general
            </h3>
            <p>
              <strong>Todo procedimiento se elimina automáticamente 7 días calendario después de su
              fecha de creación</strong>, sin excepción y sin importar:
            </p>
            <ul className="list-disc space-y-1 pl-6">
              <li>si el procedimiento quedó en estado Borrador o Finalizado;</li>
              <li>
                si un administrador desbloqueó la edición para corregir un error — esa intervención{" "}
                <strong>no reinicia ni extiende</strong> el plazo.
              </li>
            </ul>
            <p>
              La eliminación incluye todos los datos asociados al procedimiento: funcionario y
              compañero de patrulla registrados en ese procedimiento, intervinientes, víctimas,
              testigos, elementos incautados, actuaciones, relato, pago, y los documentos generados.
            </p>
            <p>
              <strong>
                Pasado este plazo de 7 días, la información de las personas involucradas en el
                procedimiento no es recuperable por ningún medio.
              </strong>{" "}
              La eliminación es definitiva e irreversible — la plataforma no conserva copias, respaldos
              de largo plazo, ni ningún otro rastro del contenido sensible del procedimiento. Esta
              irreversibilidad es intencional: es la garantía real de que los datos personales no
              permanecen en la plataforma más tiempo del estrictamente necesario para generar los
              documentos oficiales correspondientes.
            </p>

            <h3 className="font-sans text-base font-semibold text-institucional-950">
              4.2 Aviso previo
            </h3>
            <p>
              Al <strong>día 5</strong> de creado el procedimiento, la plataforma notifica al
              funcionario responsable que el procedimiento será eliminado en 2 días — esta notificación
              aplica a todos los procedimientos, sin importar su estado, para darle oportunidad de
              descargar los documentos que necesite conservar por sus propios medios.
            </p>

            <h3 className="font-sans text-base font-semibold text-institucional-950">
              4.3 Qué NO se elimina
            </h3>
            <ul className="list-disc space-y-1 pl-6">
              <li>
                <strong>Las cuentas de usuario</strong> de los funcionarios no se eliminan bajo este
                esquema. Un funcionario conserva acceso a la plataforma para crear nuevos
                procedimientos independientemente de cuántos procedimientos anteriores se hayan
                eliminado automáticamente.
              </li>
              <li>
                <strong>El registro de auditoría</strong> conserva un rastro mínimo de la actividad
                (quién realizó qué acción y cuándo) con fines de trazabilidad institucional, pero{" "}
                <strong>sin el contenido sensible</strong> del procedimiento eliminado.
              </li>
            </ul>

            <h3 className="font-sans text-base font-semibold text-institucional-950">
              4.4 Responsabilidad del funcionario tras la descarga
            </h3>
            <p>
              Una vez el funcionario descarga los documentos generados (FPJ-5, FPJ-6, Acta de
              Incautación, FPJ-7, FPJ-8), la conservación de esos documentos y su radicación ante la
              autoridad competente es responsabilidad del funcionario, conforme a los procedimientos y
              plazos legales vigentes. La plataforma es una herramienta de generación documental, no el
              repositorio oficial ni permanente de los procedimientos.
            </p>
          </Seccion>

          <Seccion numero="5" titulo="Tratamiento a través de terceros — generación automática de narrativa">
            <p>
              Para generar la narrativa del FPJ-5, la plataforma envía la información del procedimiento
              a la API comercial de Anthropic (proveedor del modelo de lenguaje utilizado). El
              tratamiento que Anthropic da a esta información está sujeto a las siguientes garantías,
              conforme a su documentación vigente:
            </p>
            <ul className="list-disc space-y-2 pl-6">
              <li>
                <strong>Anthropic no entrena sus modelos con esta información.</strong> El uso se rige
                por Términos Comerciales, distintos de los términos de un usuario individual de
                consumo — estos términos prohíben expresamente el entrenamiento de modelos con estos
                datos, salvo autorización expresa mediante un programa de opt-in que esta plataforma no
                ha activado.
              </li>
              <li>
                <strong>
                  La información no se almacena ni se utiliza para ningún fin distinto al estrictamente
                  necesario
                </strong>{" "}
                para generar el documento solicitado. Los datos de entrada y salida de la API se
                eliminan automáticamente a los 7 días, y durante ese periodo se conservan únicamente con
                fines de monitoreo de abuso y seguridad — no para ningún otro propósito.
              </li>
            </ul>
          </Seccion>

          <Seccion numero="6" titulo="Medidas de seguridad">
            <ul className="list-disc space-y-1 pl-6">
              <li>
                Autenticación por cuenta individual, con verificación en dos pasos; cada funcionario
                solo ve sus propios procedimientos.
              </li>
              <li>Control de acceso diferenciado (funcionario / administrador), revisado en cada solicitud.</li>
              <li>
                Sesión protegida mediante cookie de acceso restringido (HttpOnly), invisible para
                scripts del navegador — protección de fondo contra el robo de sesión.
              </li>
              <li>La sesión se invalida automáticamente en todos los dispositivos al cambiar la contraseña.</li>
              <li>Bloqueo automático de la cuenta tras múltiples intentos fallidos de inicio de sesión.</li>
              <li>Toda la comunicación entre el funcionario y la plataforma viaja cifrada (HTTPS).</li>
              <li>
                Validación del contenido real de los archivos adjuntos (comprobantes de pago), no solo
                del nombre o extensión declarados.
              </li>
              <li>Trazabilidad de toda acción relevante mediante registro de auditoría.</li>
              <li>Respaldo automático diario de la información operativa, con su propio ciclo de purga acotado.</li>
              <li>
                Servidores protegidos con cortafuegos activo, acceso administrativo restringido
                exclusivamente por llave criptográfica (sin contraseñas), y actualizaciones de
                seguridad del sistema operativo aplicadas automáticamente.
              </li>
              <li>Eliminación automática de datos sensibles conforme a la Sección 4, como medida de minimización.</li>
            </ul>
          </Seccion>

          <Seccion numero="7" titulo="Derechos de los titulares (Habeas Data)">
            <p>
              Toda persona cuyos datos sean tratados por la plataforma tiene derecho a conocer,
              actualizar, rectificar y solicitar la supresión de sus datos personales, conforme a la
              Ley 1581 de 2012, salvo que exista un deber legal o contractual de conservarlos.
            </p>
            <p>
              Estas solicitudes pueden dirigirse al correo{" "}
              <a href="mailto:soporte@gestiondigital.co" className="text-acento hover:underline">
                soporte@gestiondigital.co
              </a>
              .
            </p>
          </Seccion>

          <Seccion numero="8" titulo="Responsable del tratamiento">
            <p>
              <strong>Responsable:</strong> Gestión Digital
              <br />
              <strong>Contacto:</strong>{" "}
              <a href="mailto:soporte@gestiondigital.co" className="text-acento hover:underline">
                soporte@gestiondigital.co
              </a>
            </p>
          </Seccion>

          <Seccion numero="9" titulo="Vigencia">
            <p>
              Este documento se encuentra vigente desde su fecha de publicación, y podrá actualizarse
              cuando cambien las condiciones técnicas de la plataforma o las políticas de los
              proveedores de terceros mencionados en la Sección 5.
            </p>
          </Seccion>
        </article>
      </div>
    </div>
  );
}

function Seccion({ numero, titulo, children }: { numero: string; titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl text-institucional-950">
        {numero}. {titulo}
      </h2>
      <div className="space-y-3 font-sans text-sm leading-relaxed text-institucional-800">{children}</div>
    </section>
  );
}

function FilaTabla({
  categoria,
  datos,
  sensibilidad,
}: {
  categoria: string;
  datos: string;
  sensibilidad: string;
}) {
  return (
    <tr className="border-b border-institucional-50 align-top">
      <td className="py-2 pr-4 font-medium">{categoria}</td>
      <td className="py-2 pr-4">{datos}</td>
      <td className="py-2">{sensibilidad}</td>
    </tr>
  );
}
